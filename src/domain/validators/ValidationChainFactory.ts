import { BookingValidator } from './BookingValidator';
import { SlotCapacityValidator } from './SlotCapacityValidator';
import { CooldownValidator } from './CooldownValidator';
import { AdvanceFundsValidator } from './AdvanceFundsValidator';
import { UserRatingValidator } from './UserRatingValidator';

/**
 * ValidationChainFactory (KI-26)
 * Assembles the Chain of Responsibility in strict order:
 * 1. SlotCapacityValidator
 * 2. CooldownValidator
 * 3. AdvanceFundsValidator
 * 4. UserRatingValidator
 */
export class ValidationChainFactory {
  static build(): BookingValidator {
    const slotCapacity = new SlotCapacityValidator();
    const cooldown = new CooldownValidator();
    const advanceFunds = new AdvanceFundsValidator();
    const userRating = new UserRatingValidator();

    slotCapacity
      .setNext(cooldown)
      .setNext(advanceFunds)
      .setNext(userRating);

    return slotCapacity;
  }
}
