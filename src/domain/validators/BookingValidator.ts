import { User } from '../entities/User';
import { Kit } from '../entities/Kit';
import { Slot } from '../entities/Slot';
import { Booking } from '../entities/Booking';

export interface ValidationContext {
  user: User;
  kit: Kit;
  slot: Slot;
  proposedPricePaise: number;
  existingBookings: Booking[];
  now: Date;
}

/**
 * Chain of Responsibility Pattern: BookingValidator base class
 */
export abstract class BookingValidator {
  private nextValidator?: BookingValidator;

  setNext(validator: BookingValidator): BookingValidator {
    this.nextValidator = validator;
    return validator;
  }

  abstract readonly name: string;
  abstract readonly stepNumber: number;

  abstract doValidate(context: ValidationContext): void;

  validate(context: ValidationContext): void {
    this.doValidate(context);
    if (this.nextValidator) {
      this.nextValidator.validate(context);
    }
  }
}
