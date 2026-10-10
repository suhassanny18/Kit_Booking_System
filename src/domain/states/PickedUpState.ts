import { BaseBookingState } from './BookingState';
import { BookingStatus, ReturnCondition } from '../enums';
import type { Booking } from '../entities/Booking';
import { ReturnedState } from './ReturnedState';

export class PickedUpState extends BaseBookingState {
  getStatus(): BookingStatus {
    return BookingStatus.PICKED_UP;
  }

  returnKit(booking: Booking, condition: ReturnCondition): void {
    booking._setReturnCondition(condition);
    booking._setState(new ReturnedState());
  }
}
