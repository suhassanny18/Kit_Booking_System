import { BookingValidator, ValidationContext } from './BookingValidator';
import { BookingStatus } from '../enums';
import { DomainError } from '../errors';

export class CooldownValidator extends BookingValidator {
  public readonly name = 'Rebooking & Turnaround Cooldown Check';
  public readonly stepNumber = 2;

  doValidate(context: ValidationContext): void {
    const { user, kit, existingBookings, now } = context;

    // 1. Check earlier bookings by the same user for the same kit (User Rebooking Cooldown - KI-08)
    const userCooldownBooking = existingBookings.find((b) => {
      // Cooldown from a CANCELLED booking is ignored
      if (b.status === BookingStatus.CANCELLED) {
        return false;
      }
      return (
        b.userId === user.id &&
        b.kitId === kit.id &&
        b.cooldownUntil.getTime() > now.getTime()
      );
    });

    if (userCooldownBooking) {
      const remainingMs = userCooldownBooking.cooldownUntil.getTime() - now.getTime();
      const remainingMin = Math.ceil(remainingMs / (60 * 1000));
      throw new DomainError(
        'COOLDOWN_ACTIVE',
        `Rebooking cooldown active for this kit. Please wait ${remainingMin} more minute(s) before requesting this kit again.`
      );
    }

    // 2. Human Common Sense: Kit Turnaround & Owner Inspection Cooldown
    // When a kit is returned by a customer, the owner must check it (sensor, optics, mics, tripod).
    // The kit enters a 20-minute turnaround inspection buffer.
    // If all units of this kit are currently cooling down under active owner inspection:
    const activeInspectionBookings = existingBookings.filter((b) => {
      if (b.kitId !== kit.id) return false;
      if (b.status === BookingStatus.CANCELLED || b.status === BookingStatus.REJECTED) return false;
      return (
        (b.status === BookingStatus.RETURNED ||
          (b.inspectionCooldownUntil && b.inspectionCooldownUntil.getTime() > now.getTime())) &&
        b.inspectionCooldownUntil &&
        b.inspectionCooldownUntil.getTime() > now.getTime()
      );
    });

    if (activeInspectionBookings.length >= kit.totalQuantity) {
      const latestCooldown = activeInspectionBookings.reduce(
        (max, b) => (b.inspectionCooldownUntil!.getTime() > max.getTime() ? b.inspectionCooldownUntil! : max),
        activeInspectionBookings[0].inspectionCooldownUntil!
      );
      const remainingMs = latestCooldown.getTime() - now.getTime();
      const remainingMin = Math.ceil(remainingMs / (60 * 1000));
      throw new DomainError(
        'COOLDOWN_ACTIVE',
        `Kit Turnaround Cooldown Active: Gear was recently returned and is undergoing physical owner inspection (sensor, optics & mics). Cooldown remaining: ${remainingMin} minute(s). Please try after owner inspection completes.`
      );
    }
  }
}
