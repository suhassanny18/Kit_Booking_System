import { BookingValidator, ValidationContext } from './BookingValidator';
import { BookingStatus } from '../enums';
import { DomainError } from '../errors';

export class SlotCapacityValidator extends BookingValidator {
  public readonly name = 'Slot Capacity Check';
  public readonly stepNumber = 1;

  doValidate(context: ValidationContext): void {
    const { kit, slot, existingBookings } = context;

    // Only APPROVED and PICKED_UP bookings consume capacity (KI-11, KI-12)
    const activeCommittedBookings = existingBookings.filter(
      (b) =>
        b.kitId === kit.id &&
        (b.status === BookingStatus.APPROVED || b.status === BookingStatus.PICKED_UP) &&
        b.slot.overlaps(slot)
    );

    if (activeCommittedBookings.length >= kit.totalQuantity) {
      throw new DomainError(
        'SLOT_CAPACITY_EXCEEDED',
        `No capacity available for ${slot.formatDisplay()}. All ${kit.totalQuantity} unit(s) are already booked or in use.`
      );
    }
  }
}
