import { User } from '../domain/entities/User';
import { Booking } from '../domain/entities/Booking';
import { ReturnCondition, BookingStatus } from '../domain/enums';
import { DomainError } from '../domain/errors';

export class RatingService {
  /**
   * Adjusts raw owner score (0.0 - 5.0) based on kit return condition.
   */
  computeAdjustedRating(rawScore: number, condition: ReturnCondition): number {
    if (rawScore < 0 || rawScore > 5) {
      throw new DomainError('INVALID_RATING_RANGE', 'Rating must be between 0.0 and 5.0');
    }

    let adjusted: number;
    switch (condition) {
      case ReturnCondition.PRISTINE:
        adjusted = Math.min(5.0, rawScore + 0.5);
        break;
      case ReturnCondition.GOOD:
        adjusted = rawScore;
        break;
      case ReturnCondition.FAIR:
        adjusted = Math.max(0.0, rawScore - 0.5);
        break;
      case ReturnCondition.DAMAGED:
        adjusted = 1.0; // fixed 1.0
        break;
    }

    return Number(adjusted.toFixed(2));
  }

  /**
   * Applies the rating to user and advances booking to COMPLETED atomically (KI-21).
   */
  rateUserAfterReturn(user: User, booking: Booking, rawScore: number): number {
    if (booking.status !== BookingStatus.RETURNED) {
      throw new DomainError(
        'ILLEGAL_TRANSITION',
        `Cannot rate user when booking is in ${booking.status} state. Booking must be RETURNED.`
      );
    }

    if (!booking.returnCondition) {
      throw new DomainError('INVALID_INPUT', 'Booking must have a return condition set before rating');
    }

    const adjustedScore = this.computeAdjustedRating(rawScore, booking.returnCondition);
    user.applyRating(adjustedScore);

    // Atomically transition state to COMPLETED
    booking.complete();

    return adjustedScore;
  }
}
