import { BookingValidator, ValidationContext } from './BookingValidator';
import { ADVANCE_PCT } from '../constants';
import { DomainError } from '../errors';

export class AdvanceFundsValidator extends BookingValidator {
  public readonly name = 'Advance Funds Check (20%)';
  public readonly stepNumber = 3;

  doValidate(context: ValidationContext): void {
    const { user, proposedPricePaise } = context;

    if (proposedPricePaise <= 0) {
      throw new DomainError('INVALID_INPUT', 'Proposed price must be greater than zero.');
    }

    const requiredAdvance = Math.round(proposedPricePaise * ADVANCE_PCT);

    if (user.wallet < requiredAdvance) {
      const requiredRs = (requiredAdvance / 100).toFixed(2);
      const availableRs = (user.wallet / 100).toFixed(2);
      throw new DomainError(
        'INSUFFICIENT_FUNDS_FOR_ADVANCE',
        `Insufficient wallet balance to cover the 20% advance (₹${requiredRs}). Available: ₹${availableRs}. Please top up your wallet.`
      );
    }
  }
}
