import { BookingValidator, ValidationContext } from './BookingValidator';
import { MIN_RATING_TO_BOOK } from '../constants';
import { DomainError } from '../errors';

export class UserRatingValidator extends BookingValidator {
  public readonly name = 'User Rating Check (Min 1.0)';
  public readonly stepNumber = 4;

  doValidate(context: ValidationContext): void {
    const { user } = context;

    if (user.rating < MIN_RATING_TO_BOOK) {
      throw new DomainError(
        'RATING_BELOW_BOOKING_THRESHOLD',
        `User rating (${user.rating.toFixed(2)}) is below the minimum threshold (${MIN_RATING_TO_BOOK.toFixed(1)}) required to request bookings.`
      );
    }
  }
}
