import { Slot } from '../domain/entities/Slot';
import { FIXED_DAILY_SLOTS } from '../domain/constants';
import { KitRepository } from '../repositories/KitRepository';
import { BookingRepository } from '../repositories/BookingRepository';
import { BookingStatus } from '../domain/enums';
import { DomainError } from '../domain/errors';

export interface SlotAvailability {
  slot: Slot;
  slotDefinitionId: string;
  label: string;
  totalQuantity: number;
  consumedQuantity: number;
  availableQuantity: number;
  isAvailable: boolean;
  disabledReason?: string;
}

export class SlotService {
  constructor(
    private kitRepo: KitRepository,
    private bookingRepo: BookingRepository
  ) {}

  /**
   * Generates fixed slots for a given date and computes availability.
   * Matches SlotCapacityValidator: only APPROVED and PICKED_UP consume capacity.
   */
  getAvailableSlots(kitId: string, targetDate: Date): SlotAvailability[] {
    const kit = this.kitRepo.findById(kitId);
    if (!kit) {
      throw new DomainError('ENTITY_NOT_FOUND', `Kit with ID ${kitId} not found`);
    }

    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const day = targetDate.getDate();

    const existingBookings = this.bookingRepo.findByKitId(kitId);

    return FIXED_DAILY_SLOTS.map((def) => {
      const start = new Date(year, month, day, def.startHour, def.startMinute, 0, 0);
      const end = new Date(year, month, day, def.endHour, def.endMinute, 0, 0);
      const slot = new Slot(start, end);

      const activeCommitted = existingBookings.filter(
        (b) =>
          (b.status === BookingStatus.APPROVED || b.status === BookingStatus.PICKED_UP) &&
          b.slot.overlaps(slot)
      );

      const consumed = activeCommitted.length;
      const remaining = Math.max(0, kit.totalQuantity - consumed);
      const isAvailable = remaining > 0;

      return {
        slot,
        slotDefinitionId: def.id,
        label: def.label,
        totalQuantity: kit.totalQuantity,
        consumedQuantity: consumed,
        availableQuantity: remaining,
        isAvailable,
        disabledReason: isAvailable ? undefined : `All ${kit.totalQuantity} unit(s) booked for this slot`,
      };
    });
  }
}
