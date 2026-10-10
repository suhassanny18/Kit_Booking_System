import { Booking } from '../domain/entities/Booking';
import { Slot } from '../domain/entities/Slot';
import { BookingStatus, BookingEventType, ActorType, ReturnCondition } from '../domain/enums';
import { DomainError } from '../domain/errors';
import { REBOOK_COOLDOWN_MIN, KIT_TURNAROUND_COOLDOWN_MIN } from '../domain/constants';
import { Clock } from '../domain/clock';
import { BookingValidator } from '../domain/validators/BookingValidator';
import { ApprovalStrategy } from '../domain/strategies/ApprovalStrategy';
import { ForfeitPolicy } from '../domain/strategies/ForfeitPolicy';
import { PriorityStrategy } from '../domain/strategies/PriorityStrategy';
import { UserRepository } from '../repositories/UserRepository';
import { OwnerRepository } from '../repositories/OwnerRepository';
import { KitRepository } from '../repositories/KitRepository';
import { BookingRepository } from '../repositories/BookingRepository';
import { BookingObserver, BookingEvent } from '../observers/BookingObserver';
import { AuditObserver } from '../observers/AuditObserver';
import { PaymentService } from './PaymentService';
import { RatingService } from './RatingService';
import { UnitOfWork } from './UnitOfWork';

export class BookingService {
  private observers: BookingObserver[] = [];
  private auditObserver?: AuditObserver;

  constructor(
    private userRepo: UserRepository,
    private ownerRepo: OwnerRepository,
    private kitRepo: KitRepository,
    private bookingRepo: BookingRepository,
    private paymentService: PaymentService,
    private ratingService: RatingService,
    private validationChain: BookingValidator,
    private approvalStrategy: ApprovalStrategy,
    private forfeitPolicy: ForfeitPolicy,
    private priorityStrategy: PriorityStrategy,
    private clock: Clock,
    private unitOfWork: UnitOfWork
  ) {}

  addObserver(observer: BookingObserver): void {
    this.observers.push(observer);
    if (observer instanceof AuditObserver) {
      this.auditObserver = observer;
    }
  }

  setForfeitPolicy(policy: ForfeitPolicy): void {
    this.forfeitPolicy = policy;
  }

  getForfeitPolicy(): ForfeitPolicy {
    return this.forfeitPolicy;
  }

  setApprovalStrategy(strategy: ApprovalStrategy): void {
    this.approvalStrategy = strategy;
  }

  getApprovalStrategy(): ApprovalStrategy {
    return this.approvalStrategy;
  }

  setPriorityStrategy(strategy: PriorityStrategy): void {
    this.priorityStrategy = strategy;
  }

  getPriorityStrategy(): PriorityStrategy {
    return this.priorityStrategy;
  }

  /**
   * Publishes events to observers with safe isolation (KI-22).
   */
  private emit(event: BookingEvent): void {
    for (const observer of this.observers) {
      try {
        observer.onEvent(event);
      } catch (err: any) {
        if (this.auditObserver && observer !== this.auditObserver) {
          this.auditObserver.logObserverFailure(
            observer.name,
            err instanceof Error ? err : new Error(String(err)),
            event.bookingId,
            this.clock.now()
          );
        }
      }
    }
  }

  /**
   * 1. requestBooking
   * Order: load user & kit, run validation chain, hold advance, create booking, save, emit REQUESTED
   */
  requestBooking(userId: string, kitId: string, slot: Slot, proposedPricePaise: number): Booking {
    return this.unitOfWork.execute(() => {
      const user = this.userRepo.findById(userId);
      if (!user) {
        throw new DomainError('ENTITY_NOT_FOUND', `User ${userId} not found`);
      }

      const kit = this.kitRepo.findById(kitId);
      if (!kit) {
        throw new DomainError('ENTITY_NOT_FOUND', `Kit ${kitId} not found`);
      }

      const now = this.clock.now();
      const existingBookings = this.bookingRepo.findAll();

      // Run validation chain (SlotCapacity, Cooldown, AdvanceFunds, UserRating)
      this.validationChain.validate({
        user,
        kit,
        slot,
        proposedPricePaise,
        existingBookings,
        now,
      });

      const bookingId = `BKG-${Date.now().toString(36).slice(-6)}-${Math.random().toString(36).slice(2, 5)}`.toUpperCase();

      // Hold 20% advance in escrow
      const advanceAmount = this.paymentService.holdAdvance(user, bookingId, proposedPricePaise);

      // Cooldown is 20 minutes from request creation
      const cooldownUntil = new Date(now.getTime() + REBOOK_COOLDOWN_MIN * 60 * 1000);

      const booking = new Booking(
        bookingId,
        userId,
        kitId,
        kit.ownerId,
        slot,
        proposedPricePaise,
        advanceAmount,
        now,
        cooldownUntil
      );

      this.userRepo.save(user);
      this.bookingRepo.save(booking);

      this.emit({
        id: `EVT-${Date.now()}-REQ`,
        type: BookingEventType.REQUESTED,
        bookingId: booking.id,
        userId: user.id,
        ownerId: kit.ownerId,
        actor: user.name,
        actorType: ActorType.USER,
        timestamp: now,
        message: `${user.name} requested booking for ${kit.tier} Kit (${slot.formatDisplay()}) at ₹${(proposedPricePaise / 100).toFixed(2)}. Advance ₹${(advanceAmount / 100).toFixed(2)} held in escrow.`,
      });

      return booking;
    });
  }

  /**
   * 2. userCounter
   */
  userCounter(bookingId: string, userId: string, counterPricePaise: number): Booking {
    return this.unitOfWork.execute(() => {
      const booking = this.getBooking(bookingId);
      if (booking.userId !== userId) {
        throw new DomainError('UNAUTHORIZED', 'Only the booking user can counter-offer as user');
      }

      if (counterPricePaise <= 0) {
        throw new DomainError('INVALID_INPUT', 'Counter offer must be positive');
      }

      const user = this.userRepo.findById(userId);
      const now = this.clock.now();

      booking.counterOffer(ActorType.USER, counterPricePaise, now);
      this.bookingRepo.save(booking);

      this.emit({
        id: `EVT-${Date.now()}-CTR-U`,
        type: BookingEventType.COUNTER_OFFER,
        bookingId: booking.id,
        userId: booking.userId,
        ownerId: booking.ownerId,
        actor: user?.name || userId,
        actorType: ActorType.USER,
        timestamp: now,
        message: `${user?.name || 'User'} made a counter offer of ₹${(counterPricePaise / 100).toFixed(2)}.`,
      });

      return booking;
    });
  }

  /**
   * 2b. ownerCounter
   */
  ownerCounter(bookingId: string, ownerId: string, counterPricePaise: number): Booking {
    return this.unitOfWork.execute(() => {
      const booking = this.getBooking(bookingId);
      if (booking.ownerId !== ownerId) {
        throw new DomainError('UNAUTHORIZED', 'Only the kit owner can counter-offer as owner');
      }

      if (counterPricePaise <= 0) {
        throw new DomainError('INVALID_INPUT', 'Counter offer must be positive');
      }

      const owner = this.ownerRepo.findById(ownerId);
      const now = this.clock.now();

      booking.counterOffer(ActorType.OWNER, counterPricePaise, now);
      this.bookingRepo.save(booking);

      this.emit({
        id: `EVT-${Date.now()}-CTR-O`,
        type: BookingEventType.COUNTER_OFFER,
        bookingId: booking.id,
        userId: booking.userId,
        ownerId: booking.ownerId,
        actor: owner?.name || ownerId,
        actorType: ActorType.OWNER,
        timestamp: now,
        message: `${owner?.name || 'Owner'} made a counter offer of ₹${(counterPricePaise / 100).toFixed(2)}.`,
      });

      return booking;
    });
  }

  /**
   * 3. userAccept
   */
  userAccept(bookingId: string, userId: string): Booking {
    return this.unitOfWork.execute(() => {
      const booking = this.getBooking(bookingId);
      if (booking.userId !== userId) {
        throw new DomainError('UNAUTHORIZED', 'Only the booking user can accept as user');
      }

      const user = this.userRepo.findById(userId);
      const now = this.clock.now();

      booking.acceptOffer(ActorType.USER);
      this.bookingRepo.save(booking);

      this.emit({
        id: `EVT-${Date.now()}-ACC-U`,
        type: BookingEventType.OFFER_ACCEPTED,
        bookingId: booking.id,
        userId: booking.userId,
        ownerId: booking.ownerId,
        actor: user?.name || userId,
        actorType: ActorType.USER,
        timestamp: now,
        message: `${user?.name || 'User'} accepted the owner's offer of ₹${(booking.agreedPrice / 100).toFixed(2)}. Awaiting final owner approval.`,
      });

      return booking;
    });
  }

  /**
   * 3b. ownerAccept
   */
  ownerAccept(bookingId: string, ownerId: string): Booking {
    return this.unitOfWork.execute(() => {
      const booking = this.getBooking(bookingId);
      if (booking.ownerId !== ownerId) {
        throw new DomainError('UNAUTHORIZED', 'Only the kit owner can accept as owner');
      }

      const owner = this.ownerRepo.findById(ownerId);
      const now = this.clock.now();

      booking.acceptOffer(ActorType.OWNER);
      this.bookingRepo.save(booking);

      this.emit({
        id: `EVT-${Date.now()}-ACC-O`,
        type: BookingEventType.OFFER_ACCEPTED,
        bookingId: booking.id,
        userId: booking.userId,
        ownerId: booking.ownerId,
        actor: owner?.name || ownerId,
        actorType: ActorType.OWNER,
        timestamp: now,
        message: `${owner?.name || 'Owner'} accepted the user's offer of ₹${(booking.agreedPrice / 100).toFixed(2)}.`,
      });

      return booking;
    });
  }

  /**
   * 4. ownerApprove
   * Order: ownership check, approval strategy, capacity re-check, adjust advance to 20% of agreed price, transition, save, emit APPROVED
   */
  ownerApprove(bookingId: string, ownerId: string): Booking {
    return this.unitOfWork.execute(() => {
      const booking = this.getBooking(bookingId);
      if (booking.ownerId !== ownerId) {
        throw new DomainError('UNAUTHORIZED', 'Only the kit owner can approve this booking');
      }

      const user = this.userRepo.findById(booking.userId);
      if (!user) throw new DomainError('ENTITY_NOT_FOUND', `User ${booking.userId} not found`);

      const kit = this.kitRepo.findById(booking.kitId);
      if (!kit) throw new DomainError('ENTITY_NOT_FOUND', `Kit ${booking.kitId} not found`);

      const owner = this.ownerRepo.findById(ownerId);

      // Approval strategy check (e.g. user rating >= 2.5)
      this.approvalStrategy.validate(user, kit, booking);

      // Capacity re-check (KI-11, KI-12)
      const existing = this.bookingRepo.findByKitId(kit.id);
      const activeCommitted = existing.filter(
        (b) =>
          b.id !== booking.id &&
          (b.status === BookingStatus.APPROVED || b.status === BookingStatus.PICKED_UP) &&
          b.slot.overlaps(booking.slot)
      );

      if (activeCommitted.length >= kit.totalQuantity) {
        throw new DomainError(
          'SLOT_CAPACITY_EXCEEDED',
          `Cannot approve: Slot ${booking.slot.formatDisplay()} is fully booked (${kit.totalQuantity}/${kit.totalQuantity} units committed).`
        );
      }

      // Lock agreedPrice to the latest offer before computing adjusted advance
      booking._setAgreedPrice(booking.proposedPrice);

      // Recompute and adjust advance to 20% of agreed price (KI-10)
      this.paymentService.adjustAdvanceOnApproval(user, booking);

      // Transition to APPROVED
      booking.approve();

      this.userRepo.save(user);
      this.bookingRepo.save(booking);

      const now = this.clock.now();
      this.emit({
        id: `EVT-${Date.now()}-APP`,
        type: BookingEventType.APPROVED,
        bookingId: booking.id,
        userId: booking.userId,
        ownerId: booking.ownerId,
        actor: owner?.name || ownerId,
        actorType: ActorType.OWNER,
        timestamp: now,
        message: `${owner?.name || 'Owner'} approved booking ${booking.id} at agreed price ₹${(booking.agreedPrice / 100).toFixed(2)}. Advance adjusted to ₹${(booking.advanceAmount / 100).toFixed(2)}.`,
      });

      return booking;
    });
  }

  /**
   * 5. ownerReject
   * Order: ownership check, transition, apply forfeit policy, save, emit REJECTED
   */
  ownerReject(bookingId: string, ownerId: string): Booking {
    return this.unitOfWork.execute(() => {
      const booking = this.getBooking(bookingId);
      if (booking.ownerId !== ownerId) {
        throw new DomainError('UNAUTHORIZED', 'Only the kit owner can reject this booking');
      }

      const user = this.userRepo.findById(booking.userId);
      if (!user) throw new DomainError('ENTITY_NOT_FOUND', `User ${booking.userId} not found`);

      const owner = this.ownerRepo.findById(ownerId);
      if (!owner) throw new DomainError('ENTITY_NOT_FOUND', `Owner ${ownerId} not found`);

      booking.reject();

      // Apply forfeit policy
      this.paymentService.forfeitOrRefundOnRejection(user, owner, booking, this.forfeitPolicy);

      this.userRepo.save(user);
      this.ownerRepo.save(owner);
      this.bookingRepo.save(booking);

      const now = this.clock.now();
      this.emit({
        id: `EVT-${Date.now()}-REJ`,
        type: BookingEventType.REJECTED,
        bookingId: booking.id,
        userId: booking.userId,
        ownerId: booking.ownerId,
        actor: owner.name,
        actorType: ActorType.OWNER,
        timestamp: now,
        message: `${owner.name} rejected booking ${booking.id}. Policy applied: ${this.forfeitPolicy.name}.`,
      });

      return booking;
    });
  }

  /**
   * 6. cancelBooking (KI-06)
   * User can cancel from REQUESTED, NEGOTIATING, APPROVED. Cancelling an APPROVED booking releases capacity.
   */
  cancelBooking(bookingId: string, actorId: string): Booking {
    return this.unitOfWork.execute(() => {
      const booking = this.getBooking(bookingId);

      // Either user or owner may cancel, but usually user cancels
      if (booking.userId !== actorId && booking.ownerId !== actorId) {
        throw new DomainError('UNAUTHORIZED', 'Only booking participants can cancel this booking');
      }

      const user = this.userRepo.findById(booking.userId);
      if (!user) throw new DomainError('ENTITY_NOT_FOUND', `User ${booking.userId} not found`);

      const owner = this.ownerRepo.findById(booking.ownerId);
      if (!owner) throw new DomainError('ENTITY_NOT_FOUND', `Owner ${booking.ownerId} not found`);

      booking.cancel();

      // Apply forfeit policy on cancellation
      this.paymentService.forfeitOrRefundOnCancellation(user, owner, booking, this.forfeitPolicy);

      this.userRepo.save(user);
      this.ownerRepo.save(owner);
      this.bookingRepo.save(booking);

      const now = this.clock.now();
      const actorName = actorId === user.id ? user.name : owner.name;
      const actorType = actorId === user.id ? ActorType.USER : ActorType.OWNER;

      this.emit({
        id: `EVT-${Date.now()}-CNC`,
        type: BookingEventType.CANCELLED,
        bookingId: booking.id,
        userId: booking.userId,
        ownerId: booking.ownerId,
        actor: actorName,
        actorType,
        timestamp: now,
        message: `${actorName} cancelled booking ${booking.id}. Capacity released. Advance handled under ${this.forfeitPolicy.name}.`,
      });

      return booking;
    });
  }

  /**
   * 7. pickup
   * Order: ownership check, transition, save, emit PICKED_UP
   */
  pickup(bookingId: string, ownerId: string): Booking {
    return this.unitOfWork.execute(() => {
      const booking = this.getBooking(bookingId);
      if (booking.ownerId !== ownerId) {
        throw new DomainError('UNAUTHORIZED', 'Only the kit owner can mark kit as picked up');
      }

      const owner = this.ownerRepo.findById(ownerId);

      booking.pickup();
      this.bookingRepo.save(booking);

      const now = this.clock.now();
      this.emit({
        id: `EVT-${Date.now()}-PCK`,
        type: BookingEventType.PICKED_UP,
        bookingId: booking.id,
        userId: booking.userId,
        ownerId: booking.ownerId,
        actor: owner?.name || ownerId,
        actorType: ActorType.OWNER,
        timestamp: now,
        message: `${owner?.name || 'Owner'} handed off the kit to user. Status: PICKED_UP.`,
      });

      return booking;
    });
  }

  /**
   * 8. returnKit
   * Order: ownership check, settlement funds pre-check, transition to RETURNED, settle, save, emit RETURNED
   */
  returnKit(bookingId: string, ownerId: string, condition: ReturnCondition): void {
    this.unitOfWork.execute(() => {
      const booking = this.getBooking(bookingId);
      if (booking.ownerId !== ownerId) {
        throw new DomainError('UNAUTHORIZED', 'Only the kit owner can process kit return');
      }

      const user = this.userRepo.findById(booking.userId);
      if (!user) throw new DomainError('ENTITY_NOT_FOUND', `User ${booking.userId} not found`);

      const owner = this.ownerRepo.findById(ownerId);
      if (!owner) throw new DomainError('ENTITY_NOT_FOUND', `Owner ${ownerId} not found`);

      // Pre-check settlement funds (KI-20)
      this.paymentService.checkSettlementFunds(user, booking);

      const now = this.clock.now();
      const inspectionCooldownUntil = new Date(now.getTime() + KIT_TURNAROUND_COOLDOWN_MIN * 60 * 1000);
      booking._setInspectionCooldown(now, inspectionCooldownUntil);

      // Transition state
      booking.returnKit(condition);

      // Execute settlement
      this.paymentService.settle(user, owner, booking);

      this.userRepo.save(user);
      this.ownerRepo.save(owner);
      this.bookingRepo.save(booking);

      this.emit({
        id: `EVT-${Date.now()}-RET`,
        type: BookingEventType.RETURNED,
        bookingId: booking.id,
        userId: booking.userId,
        ownerId: booking.ownerId,
        actor: owner.name,
        actorType: ActorType.OWNER,
        timestamp: now,
        message: `${owner.name} received kit in ${condition} condition. Settle completed for ₹${(booking.agreedPrice / 100).toFixed(2)}. Status: RETURNED.`,
      });
    });
  }

  /**
   * 8b. renterReturnKit
   * Human flow: Renter hands back gear at wrap of production.
   * Gear transitions to RETURNED, entering owner turnaround inspection cooldown buffer.
   */
  renterReturnKit(bookingId: string, userId: string): void {
    this.unitOfWork.execute(() => {
      const booking = this.getBooking(bookingId);
      if (booking.userId !== userId) {
        throw new DomainError('UNAUTHORIZED', 'Only the booking renter can hand back gear');
      }

      const user = this.userRepo.findById(userId);
      if (!user) throw new DomainError('ENTITY_NOT_FOUND', `User ${userId} not found`);

      const owner = this.ownerRepo.findById(booking.ownerId);
      if (!owner) throw new DomainError('ENTITY_NOT_FOUND', `Owner ${booking.ownerId} not found`);

      // Pre-check settlement funds (KI-20)
      this.paymentService.checkSettlementFunds(user, booking);

      const now = this.clock.now();
      const inspectionCooldownUntil = new Date(now.getTime() + KIT_TURNAROUND_COOLDOWN_MIN * 60 * 1000);
      booking._setInspectionCooldown(now, inspectionCooldownUntil);

      // Transition state to RETURNED (default to GOOD condition pending owner physical inspection)
      booking.returnKit(ReturnCondition.GOOD);

      // Execute settlement
      this.paymentService.settle(user, owner, booking);

      this.userRepo.save(user);
      this.ownerRepo.save(owner);
      this.bookingRepo.save(booking);

      this.emit({
        id: `EVT-${Date.now()}-RET-U`,
        type: BookingEventType.RETURNED,
        bookingId: booking.id,
        userId: booking.userId,
        ownerId: booking.ownerId,
        actor: user.name,
        actorType: ActorType.USER,
        timestamp: now,
        message: `${user.name} returned the kit to the studio. Kit entered 20-min owner inspection cooldown. Status: RETURNED.`,
      });
    });
  }

  /**
   * 9. ownerRateUser
   * Order: ownership check, require RETURNED, validate rating, apply rating and complete atomically, save, emit COMPLETED (KI-21)
   */
  ownerRateUser(bookingId: string, ownerId: string, rawScore: number, condition?: ReturnCondition): number {
    return this.unitOfWork.execute(() => {
      const booking = this.getBooking(bookingId);
      if (booking.ownerId !== ownerId) {
        throw new DomainError('UNAUTHORIZED', 'Only the kit owner can rate the user');
      }

      if (condition) {
        booking._setReturnCondition(condition);
      }

      const user = this.userRepo.findById(booking.userId);
      if (!user) throw new DomainError('ENTITY_NOT_FOUND', `User ${booking.userId} not found`);

      const owner = this.ownerRepo.findById(ownerId);

      // Rating service validates RETURNED state, validates range 0-5, adjusts score, applies to user, completes booking
      const adjustedScore = this.ratingService.rateUserAfterReturn(user, booking, rawScore);

      this.userRepo.save(user);
      this.bookingRepo.save(booking);

      const now = this.clock.now();
      this.emit({
        id: `EVT-${Date.now()}-CMP`,
        type: BookingEventType.COMPLETED,
        bookingId: booking.id,
        userId: booking.userId,
        ownerId: booking.ownerId,
        actor: owner?.name || ownerId,
        actorType: ActorType.OWNER,
        timestamp: now,
        message: `${owner?.name || 'Owner'} rated user ${rawScore.toFixed(1)}/5.0 (adjusted: ${adjustedScore.toFixed(2)} due to ${booking.returnCondition} condition). Booking ${booking.id} COMPLETED. New user rating: ${user.rating.toFixed(2)}.`,
      });

      return adjustedScore;
    });
  }

  getBooking(bookingId: string): Booking {
    const booking = this.bookingRepo.findById(bookingId);
    if (!booking) {
      throw new DomainError('ENTITY_NOT_FOUND', `Booking ${bookingId} not found`);
    }
    return booking;
  }

  listBookingsForUser(userId: string): Booking[] {
    return this.bookingRepo.findByUserId(userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  listBookingsForOwner(ownerId: string): Booking[] {
    return this.bookingRepo.findByOwnerId(ownerId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Pending bookings for owner: REQUESTED + NEGOTIATING, sorted by RatingPriorityStrategy (highest user rating first).
   */
  getPendingForOwner(ownerId: string): Booking[] {
    const all = this.bookingRepo.findByOwnerId(ownerId);
    const pending = all.filter(
      (b) => b.status === BookingStatus.REQUESTED || b.status === BookingStatus.NEGOTIATING
    );

    const userMap = new Map<string, any>();
    for (const b of pending) {
      const u = this.userRepo.findById(b.userId);
      if (u) userMap.set(b.userId, u);
    }

    return this.priorityStrategy.sort(pending, userMap);
  }
}
