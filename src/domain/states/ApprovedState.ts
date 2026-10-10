import { BaseBookingState } from './BookingState';
import { BookingStatus } from '../enums';
import type { Booking } from '../entities/Booking';
import { PickedUpState } from './PickedUpState';
import { CancelledState } from './CancelledState';

export class ApprovedState extends BaseBookingState {
  getStatus(): BookingStatus {
    return BookingStatus.APPROVED;
  }

  pickup(booking: Booking): void {
    booking._setState(new PickedUpState());
  }

  cancel(booking: Booking): void {
    booking._setState(new CancelledState());
  }
}
