import { BaseBookingState } from './BookingState';
import { BookingStatus, ActorType } from '../enums';
import type { Booking } from '../entities/Booking';
import { ApprovedState } from './ApprovedState';
import { RejectedState } from './RejectedState';
import { CancelledState } from './CancelledState';

export class NegotiatingState extends BaseBookingState {
  getStatus(): BookingStatus {
    return BookingStatus.NEGOTIATING;
  }

  counterOffer(booking: Booking, author: ActorType, amountPaise: number, timestamp: Date): void {
    booking._addOffer(author, amountPaise, timestamp);
    // Stays in NEGOTIATING
  }

  acceptOffer(booking: Booking, actor: ActorType): void {
    booking._markLatestOfferAccepted(actor);
    // Stays in NEGOTIATING
  }

  approve(booking: Booking): void {
    // approve locks agreedPrice = proposedPrice (the latest offer)
    booking._setAgreedPrice(booking.proposedPrice);
    booking._setState(new ApprovedState());
  }

  reject(booking: Booking): void {
    booking._setState(new RejectedState());
  }

  cancel(booking: Booking): void {
    booking._setState(new CancelledState());
  }
}
