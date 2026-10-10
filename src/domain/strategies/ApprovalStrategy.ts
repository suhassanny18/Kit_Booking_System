import { User } from '../entities/User';
import { Kit } from '../entities/Kit';
import { Booking } from '../entities/Booking';
import { MIN_RATING_TO_APPROVE } from '../constants';
import { DomainError } from '../errors';

/**
 * Strategy Pattern: ApprovalStrategy
 * Governs whether an owner is allowed to approve a user's booking request.
 */
export interface ApprovalStrategy {
  name: string;
  canApprove(user: User, kit: Kit, booking: Booking): boolean;
  validate(user: User, kit: Kit, booking: Booking): void;
}

export class RatingThresholdApproval implements ApprovalStrategy {
  public readonly name = `Rating Threshold Approval (Min ${MIN_RATING_TO_APPROVE.toFixed(1)})`;

  canApprove(user: User, _kit: Kit, _booking: Booking): boolean {
    return user.rating >= MIN_RATING_TO_APPROVE;
  }

  validate(user: User, _kit: Kit, _booking: Booking): void {
    if (!this.canApprove(user, _kit, _booking)) {
      throw new DomainError(
        'RATING_BELOW_APPROVAL_THRESHOLD',
        `User rating (${user.rating.toFixed(2)}) is below the required threshold of ${MIN_RATING_TO_APPROVE.toFixed(1)} to approve bookings.`
      );
    }
  }
}
