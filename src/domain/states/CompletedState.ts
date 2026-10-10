import { BaseBookingState } from './BookingState';
import { BookingStatus } from '../enums';

export class CompletedState extends BaseBookingState {
  getStatus(): BookingStatus {
    return BookingStatus.COMPLETED;
  }
}
