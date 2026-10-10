import { BaseBookingState } from './BookingState';
import { BookingStatus } from '../enums';

export class CancelledState extends BaseBookingState {
  getStatus(): BookingStatus {
    return BookingStatus.CANCELLED;
  }
}
