import { BaseBookingState } from './BookingState';
import { BookingStatus } from '../enums';
import type { Booking } from '../entities/Booking';
import { CompletedState } from './CompletedState';

export class ReturnedState extends BaseBookingState {
  getStatus(): BookingStatus {
    return BookingStatus.RETURNED;
  }

  complete(booking: Booking): void {
    booking._setState(new CompletedState());
  }
}
