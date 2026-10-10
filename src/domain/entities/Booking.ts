import { BookingStatus, ReturnCondition, ActorType } from '../enums';
import { Slot } from './Slot';
import { BookingState } from '../states/BookingState';
import { RequestedState } from '../states/RequestedState';
import { NegotiatingState } from '../states/NegotiatingState';
import { ApprovedState } from '../states/ApprovedState';
import { RejectedState } from '../states/RejectedState';
import { PickedUpState } from '../states/PickedUpState';
import { ReturnedState } from '../states/ReturnedState';
import { CompletedState } from '../states/CompletedState';
import { CancelledState } from '../states/CancelledState';
import { DomainError } from '../errors';

export interface BookingOffer {
  id: string;
  author: ActorType;
  amount: number; // in integer paise
  timestamp: Date;
  accepted: boolean;
}

export class Booking {
  public readonly id: string;
  public readonly userId: string;
  public readonly kitId: string;
  public readonly ownerId: string;
  public readonly slot: Slot;
  public readonly createdAt: Date;
  public readonly cooldownUntil: Date;

  private _state: BookingState;
  private _proposedPrice: number; // in integer paise
  private _agreedPrice: number; // in integer paise
  private _advanceAmount: number; // in integer paise held in escrow
  private _returnCondition?: ReturnCondition;
  private _returnedAt?: Date;
  private _inspectionCooldownUntil?: Date;
  private _offerHistory: BookingOffer[];
  private _lastOfferedBy: ActorType;

  constructor(
    id: string,
    userId: string,
    kitId: string,
    ownerId: string,
    slot: Slot,
    initialProposedPricePaise: number,
    initialAdvanceAmountPaise: number,
    createdAt: Date,
    cooldownUntil: Date,
    initialState?: BookingState
  ) {
    this.id = id;
    this.userId = userId;
    this.kitId = kitId;
    this.ownerId = ownerId;
    this.slot = slot;
    this.createdAt = new Date(createdAt);
    this.cooldownUntil = new Date(cooldownUntil);

    this._proposedPrice = Math.round(initialProposedPricePaise);
    this._agreedPrice = this._proposedPrice;
    this._advanceAmount = Math.round(initialAdvanceAmountPaise);
    this._lastOfferedBy = ActorType.USER;
    this._state = initialState || new RequestedState();

    this._offerHistory = [
      {
        id: `OFFER-${this.id}-0`,
        author: ActorType.USER,
        amount: this._proposedPrice,
        timestamp: new Date(createdAt),
        accepted: false,
      },
    ];
  }

  // Read-only getters
  get status(): BookingStatus {
    return this._state.getStatus();
  }

  get state(): BookingState {
    return this._state;
  }

  get proposedPrice(): number {
    return this._proposedPrice;
  }

  get agreedPrice(): number {
    return this._agreedPrice;
  }

  get advanceAmount(): number {
    return this._advanceAmount;
  }

  get returnCondition(): ReturnCondition | undefined {
    return this._returnCondition;
  }

  get returnedAt(): Date | undefined {
    return this._returnedAt;
  }

  get inspectionCooldownUntil(): Date | undefined {
    return this._inspectionCooldownUntil;
  }

  get isUnderInspection(): boolean {
    return this.status === BookingStatus.RETURNED;
  }

  get offerHistory(): readonly BookingOffer[] {
    return this._offerHistory;
  }

  get lastOfferedBy(): ActorType {
    return this._lastOfferedBy;
  }

  get latestOffer(): BookingOffer | undefined {
    return this._offerHistory[this._offerHistory.length - 1];
  }

  // Package-internal state mutation methods (called by state classes)
  _setState(newState: BookingState): void {
    this._state = newState;
  }

  _setAgreedPrice(pricePaise: number): void {
    this._agreedPrice = Math.round(pricePaise);
  }

  _setProposedPrice(pricePaise: number): void {
    this._proposedPrice = Math.round(pricePaise);
  }

  _setAdvanceAmount(amountPaise: number): void {
    this._advanceAmount = Math.round(amountPaise);
  }

  _setReturnCondition(condition: ReturnCondition): void {
    this._returnCondition = condition;
  }

  _setInspectionCooldown(returnedAt: Date, cooldownUntil: Date): void {
    this._returnedAt = new Date(returnedAt);
    this._inspectionCooldownUntil = new Date(cooldownUntil);
  }

  _addOffer(author: ActorType, amountPaise: number, timestamp: Date): void {
    // Only the other party may respond to an offer (KI-14)
    if (this._lastOfferedBy === author) {
      throw new DomainError(
        'NOT_YOUR_TURN',
        `It is not your turn to make a counter-offer. Waiting for response from ${author === ActorType.USER ? 'OWNER' : 'USER'}`
      );
    }
    const newOffer: BookingOffer = {
      id: `OFFER-${this.id}-${this._offerHistory.length}`,
      author,
      amount: Math.round(amountPaise),
      timestamp: new Date(timestamp),
      accepted: false,
    };
    this._offerHistory.push(newOffer);
    this._proposedPrice = Math.round(amountPaise);
    this._lastOfferedBy = author;
  }

  _markLatestOfferAccepted(actor: ActorType): void {
    if (this._lastOfferedBy === actor) {
      throw new DomainError('INVALID_OFFER_AUTHOR', 'Cannot accept your own offer');
    }
    const latest = this._offerHistory[this._offerHistory.length - 1];
    if (latest) {
      latest.accepted = true;
      this._agreedPrice = latest.amount;
    }
  }

  // State pattern delegation
  counterOffer(author: ActorType, amountPaise: number, timestamp: Date): void {
    this._state.counterOffer(this, author, amountPaise, timestamp);
  }

  acceptOffer(actor: ActorType): void {
    this._state.acceptOffer(this, actor);
  }

  approve(): void {
    this._state.approve(this);
  }

  reject(): void {
    this._state.reject(this);
  }

  pickup(): void {
    this._state.pickup(this);
  }

  returnKit(condition: ReturnCondition): void {
    this._state.returnKit(this, condition);
  }

  cancel(): void {
    this._state.cancel(this);
  }

  complete(): void {
    this._state.complete(this);
  }

  /**
   * Clone for UnitOfWork snapshot & rollback (KI-19)
   */
  clone(): Booking {
    const b = new Booking(
      this.id,
      this.userId,
      this.kitId,
      this.ownerId,
      this.slot,
      this._proposedPrice,
      this._advanceAmount,
      this.createdAt,
      this.cooldownUntil,
      this.recreateState(this.status)
    );
    b._agreedPrice = this._agreedPrice;
    b._returnCondition = this._returnCondition;
    b._returnedAt = this._returnedAt ? new Date(this._returnedAt) : undefined;
    b._inspectionCooldownUntil = this._inspectionCooldownUntil ? new Date(this._inspectionCooldownUntil) : undefined;
    b._lastOfferedBy = this._lastOfferedBy;
    b._offerHistory = this._offerHistory.map((o) => ({ ...o }));
    return b;
  }

  private recreateState(status: BookingStatus): BookingState {
    switch (status) {
      case BookingStatus.REQUESTED:
        return new RequestedState();
      case BookingStatus.NEGOTIATING:
        return new NegotiatingState();
      case BookingStatus.APPROVED:
        return new ApprovedState();
      case BookingStatus.REJECTED:
        return new RejectedState();
      case BookingStatus.PICKED_UP:
        return new PickedUpState();
      case BookingStatus.RETURNED:
        return new ReturnedState();
      case BookingStatus.COMPLETED:
        return new CompletedState();
      case BookingStatus.CANCELLED:
        return new CancelledState();
    }
  }
}
