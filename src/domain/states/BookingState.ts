import { BookingStatus, ReturnCondition, ActorType } from '../enums';
import { DomainError } from '../errors';
import type { Booking } from '../entities/Booking';

/**
 * State Pattern: BookingState interface with default-deny behavior
 */
export interface BookingState {
  getStatus(): BookingStatus;

  counterOffer(booking: Booking, author: ActorType, amountPaise: number, timestamp: Date): void;

  acceptOffer(booking: Booking, actor: ActorType): void;

  approve(booking: Booking): void;

  reject(booking: Booking): void;

  pickup(booking: Booking): void;

  returnKit(booking: Booking, condition: ReturnCondition): void;

  cancel(booking: Booking): void;

  complete(booking: Booking): void;
}

export abstract class BaseBookingState implements BookingState {
  abstract getStatus(): BookingStatus;

  counterOffer(_booking: Booking, _author: ActorType, _amountPaise: number, _timestamp: Date): void {
    throw new DomainError(
      'ILLEGAL_TRANSITION',
      `Cannot counter offer when booking is in ${this.getStatus()} state`
    );
  }

  acceptOffer(_booking: Booking, _actor: ActorType): void {
    throw new DomainError(
      'ILLEGAL_TRANSITION',
      `Cannot accept offer when booking is in ${this.getStatus()} state`
    );
  }

  approve(_booking: Booking): void {
    throw new DomainError(
      'ILLEGAL_TRANSITION',
      `Cannot approve booking when in ${this.getStatus()} state`
    );
  }

  reject(_booking: Booking): void {
    throw new DomainError(
      'ILLEGAL_TRANSITION',
      `Cannot reject booking when in ${this.getStatus()} state`
    );
  }

  pickup(_booking: Booking): void {
    throw new DomainError(
      'ILLEGAL_TRANSITION',
      `Cannot mark pickup when in ${this.getStatus()} state`
    );
  }

  returnKit(_booking: Booking, _condition: ReturnCondition): void {
    throw new DomainError(
      'ILLEGAL_TRANSITION',
      `Cannot return kit when in ${this.getStatus()} state`
    );
  }

  cancel(_booking: Booking): void {
    throw new DomainError(
      'ILLEGAL_TRANSITION',
      `Cannot cancel booking when in ${this.getStatus()} state`
    );
  }

  complete(_booking: Booking): void {
    throw new DomainError(
      'ILLEGAL_TRANSITION',
      `Cannot complete booking when in ${this.getStatus()} state`
    );
  }
}
