import { BaseBookingState } from './BookingState';
import { BookingStatus } from '../enums';

export class RejectedState extends BaseBookingState {
  getStatus(): BookingStatus {
    return BookingStatus.REJECTED;
  }
}
