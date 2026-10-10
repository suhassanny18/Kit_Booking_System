/**
 * Business constants for Kit Booking System
 */

export const ADVANCE_PCT = 0.20;
export const REBOOK_COOLDOWN_MIN = 20;
export const KIT_TURNAROUND_COOLDOWN_MIN = 20; // 20-minute owner inspection & turnaround buffer upon kit return
export const MIN_RATING_TO_BOOK = 1.0;
export const MIN_RATING_TO_APPROVE = 2.5;

/** Fixed slot definitions (hours) */
export interface SlotDefinition {
  id: string;
  label: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export const FIXED_DAILY_SLOTS: SlotDefinition[] = [
  { id: 'morning', label: '09:00 - 12:00', startHour: 9, startMinute: 0, endHour: 12, endMinute: 0 },
  { id: 'afternoon', label: '13:00 - 16:00', startHour: 13, startMinute: 0, endHour: 16, endMinute: 0 },
  { id: 'evening', label: '17:00 - 20:00', startHour: 17, startMinute: 0, endHour: 20, endMinute: 0 },
];
