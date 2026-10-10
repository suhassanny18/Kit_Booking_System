import { AppDependencies, buildApplication, seedDemoData } from './CompositionRoot';
import { User } from '../domain/entities/User';
import { Owner } from '../domain/entities/Owner';
import { Kit } from '../domain/entities/Kit';
import { Booking } from '../domain/entities/Booking';
import { Slot } from '../domain/entities/Slot';
import { LedgerEntry } from '../domain/entities/LedgerEntry';
import { Tier, ReturnCondition, BookingStatus } from '../domain/enums';
import { SlotAvailability } from '../services/SlotService';
import { InboxMessage } from '../observers/OwnerInboxObserver';
import { AuditLogEntry } from '../observers/AuditObserver';
import { PricingStrategy } from '../domain/strategies/PricingStrategy';
import { ForfeitPolicy } from '../domain/strategies/ForfeitPolicy';

export interface AppSettings {
  pricingStrategyId: 'FLAT' | 'TIER_MULTIPLIER';
  forfeitPolicyId: 'DEFAULT' | 'REFUND_ON_REJECTION';
}

/**
 * Facade Pattern: KitBookingApp
 * The single public gateway for the UI. The UI may ONLY call methods on this class.
 */
export class KitBookingApp {
  private deps: AppDependencies;
  private settings: AppSettings = {
    pricingStrategyId: 'FLAT',
    forfeitPolicyId: 'DEFAULT',
  };
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.deps = buildApplication();
  }

  // React state synchronization listener
  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  // =================== Auth & Actors ===================
  registerUser(name: string, initialWalletPaise: number = 0): User {
    const user = this.deps.authService.registerUser(name, initialWalletPaise);
    this.notify();
    return user;
  }

  registerOwner(name: string, initialWalletPaise: number = 0): Owner {
    const owner = this.deps.authService.registerOwner(name, initialWalletPaise);
    this.notify();
    return owner;
  }

  getUsers(): User[] {
    return this.deps.authService.listUsers();
  }

  getOwners(): Owner[] {
    return this.deps.authService.listOwners();
  }

  getUser(id: string): User | undefined {
    return this.deps.userRepo.findById(id);
  }

  getOwner(id: string): Owner | undefined {
    return this.deps.ownerRepo.findById(id);
  }

  // =================== Kits & Slots ===================
  addKit(ownerId: string, tier: Tier, quantity: number, dailyPricePaise: number): Kit {
    const kit = this.deps.kitService.addKit(ownerId, tier, quantity, dailyPricePaise);
    this.notify();
    return kit;
  }

  browseKits(): Kit[] {
    return this.deps.kitService.listKits();
  }

  getKit(id: string): Kit | undefined {
    return this.deps.kitRepo.findById(id);
  }

  slotsForKit(kitId: string, date: Date): SlotAvailability[] {
    return this.deps.slotService.getAvailableSlots(kitId, date);
  }

  suggestedPrice(kitId: string, slot: Slot): number {
    const kit = this.deps.kitService.getKit(kitId);
    const activePricingStrategy: PricingStrategy =
      this.settings.pricingStrategyId === 'TIER_MULTIPLIER'
        ? this.deps.tierMultiplierPricing
        : this.deps.flatDailyPricing;

    return activePricingStrategy.compute(kit, slot);
  }

  // =================== Bookings ===================
  book(userId: string, kitId: string, slot: Slot, proposedPricePaise: number): Booking {
    const booking = this.deps.bookingService.requestBooking(userId, kitId, slot, proposedPricePaise);
    this.notify();
    return booking;
  }

  userCounter(bookingId: string, userId: string, counterPricePaise: number): Booking {
    const booking = this.deps.bookingService.userCounter(bookingId, userId, counterPricePaise);
    this.notify();
    return booking;
  }

  userAccept(bookingId: string, userId: string): Booking {
    const booking = this.deps.bookingService.userAccept(bookingId, userId);
    this.notify();
    return booking;
  }

  ownerCounter(bookingId: string, ownerId: string, counterPricePaise: number): Booking {
    const booking = this.deps.bookingService.ownerCounter(bookingId, ownerId, counterPricePaise);
    this.notify();
    return booking;
  }

  ownerAccept(bookingId: string, ownerId: string): Booking {
    const booking = this.deps.bookingService.ownerAccept(bookingId, ownerId);
    this.notify();
    return booking;
  }

  ownerApprove(bookingId: string, ownerId: string): Booking {
    const booking = this.deps.bookingService.ownerApprove(bookingId, ownerId);
    this.notify();
    return booking;
  }

  ownerReject(bookingId: string, ownerId: string): Booking {
    const booking = this.deps.bookingService.ownerReject(bookingId, ownerId);
    this.notify();
    return booking;
  }

  cancel(bookingId: string, actorId: string): Booking {
    const booking = this.deps.bookingService.cancelBooking(bookingId, actorId);
    this.notify();
    return booking;
  }

  pickup(bookingId: string, ownerId: string): Booking {
    const booking = this.deps.bookingService.pickup(bookingId, ownerId);
    this.notify();
    return booking;
  }

  returnKit(bookingId: string, ownerId: string, condition: ReturnCondition): void {
    this.deps.bookingService.returnKit(bookingId, ownerId, condition);
    this.notify();
  }

  renterReturnKit(bookingId: string, userId: string): void {
    this.deps.bookingService.renterReturnKit(bookingId, userId);
    this.notify();
  }

  rateUser(bookingId: string, ownerId: string, rawScore: number, condition?: ReturnCondition): number {
    const adjusted = this.deps.bookingService.ownerRateUser(bookingId, ownerId, rawScore, condition);
    this.notify();
    return adjusted;
  }

  getBooking(bookingId: string): Booking {
    return this.deps.bookingService.getBooking(bookingId);
  }

  bookingsForUser(userId: string): Booking[] {
    return this.deps.bookingService.listBookingsForUser(userId);
  }

  bookingsForOwner(ownerId: string): Booking[] {
    return this.deps.bookingService.listBookingsForOwner(ownerId);
  }

  pendingForOwner(ownerId: string): Booking[] {
    return this.deps.bookingService.getPendingForOwner(ownerId);
  }

  bookingsForKit(kitId: string): Booking[] {
    return this.deps.bookingRepo.findByKitId(kitId);
  }

  getKitInspectionCooldown(kitId: string): { isInCooldown: boolean; remainingMinutes: number } {
    const bookings = this.deps.bookingRepo.findByKitId(kitId);
    const now = this.getClockTime();
    const active = bookings.filter(
      (b) =>
        b.status !== BookingStatus.CANCELLED &&
        b.status !== BookingStatus.REJECTED &&
        (b.status === BookingStatus.RETURNED ||
          (b.inspectionCooldownUntil && b.inspectionCooldownUntil.getTime() > now.getTime())) &&
        b.inspectionCooldownUntil &&
        b.inspectionCooldownUntil.getTime() > now.getTime()
    );

    if (active.length === 0) {
      return { isInCooldown: false, remainingMinutes: 0 };
    }

    const latest = active.reduce(
      (max, b) => (b.inspectionCooldownUntil!.getTime() > max.getTime() ? b.inspectionCooldownUntil! : max),
      active[0].inspectionCooldownUntil!
    );
    const remainingMs = latest.getTime() - now.getTime();
    return {
      isInCooldown: true,
      remainingMinutes: Math.max(1, Math.ceil(remainingMs / (60 * 1000))),
    };
  }

  // =================== Payments & Wallet ===================
  topUpWallet(userId: string, amountPaise: number): void {
    const user = this.deps.authService.getUser(userId);
    this.deps.paymentService.topUp(user, amountPaise);
    this.deps.userRepo.save(user);
    this.notify();
  }

  ledgerFor(bookingId: string): LedgerEntry[] {
    return this.deps.ledgerRepo.findByBookingId(bookingId);
  }

  allLedger(): LedgerEntry[] {
    return this.deps.ledgerRepo.findAll();
  }

  // =================== Inboxes & Audit ===================
  inbox(actorId: string): InboxMessage[] {
    const ownerInbox = this.deps.ownerInboxObserver.getInbox(actorId);
    if (ownerInbox.length > 0) return ownerInbox;
    return this.deps.userInboxObserver.getInbox(actorId);
  }

  markInboxRead(actorId: string, messageId: string): void {
    this.deps.ownerInboxObserver.markRead(actorId, messageId);
    this.deps.userInboxObserver.markRead(actorId, messageId);
    this.notify();
  }

  auditLog(): AuditLogEntry[] {
    return this.deps.auditObserver.getLogs();
  }

  // =================== Demo Clock ===================
  getClockTime(): Date {
    return this.deps.clock.now();
  }

  advanceClock(minutes: number): Date {
    const newTime = this.deps.clock.advanceMinutes(minutes);
    this.notify();
    return newTime;
  }

  setClockTime(time: Date): void {
    this.deps.clock.setTime(time);
    this.notify();
  }

  // =================== Settings & Demo Reset ===================
  setSettings(newSettings: Partial<AppSettings>): void {
    this.settings = { ...this.settings, ...newSettings };

    // Apply forfeit policy
    const policy: ForfeitPolicy =
      this.settings.forfeitPolicyId === 'REFUND_ON_REJECTION'
        ? this.deps.refundOnOwnerRejectionPolicy
        : this.deps.defaultForfeitPolicy;
    this.deps.bookingService.setForfeitPolicy(policy);

    this.notify();
  }

  getSettings(): AppSettings {
    return { ...this.settings };
  }

  resetDemo(): void {
    seedDemoData(this.deps.userRepo, this.deps.ownerRepo, this.deps.kitRepo);
    this.deps.bookingRepo.clear();
    this.deps.ledgerRepo.clear();
    this.deps.ownerInboxObserver.clear();
    this.deps.userInboxObserver.clear();
    this.deps.auditObserver.clear();
    this.deps.clock.setTime(new Date('2026-10-10T09:00:00.000Z'));
    this.settings = {
      pricingStrategyId: 'FLAT',
      forfeitPolicyId: 'DEFAULT',
    };
    this.deps.bookingService.setForfeitPolicy(this.deps.defaultForfeitPolicy);
    this.notify();
  }
}

// Global singleton instance for the app UI
export const kitBookingAppInstance = new KitBookingApp();
