/**
 * Typed Domain Error for Kit Booking System
 */

export type DomainErrorCode =
  | 'ILLEGAL_TRANSITION'
  | 'SLOT_CAPACITY_EXCEEDED'
  | 'COOLDOWN_ACTIVE'
  | 'INSUFFICIENT_FUNDS_FOR_ADVANCE'
  | 'INSUFFICIENT_FUNDS_FOR_SETTLEMENT'
  | 'RATING_BELOW_BOOKING_THRESHOLD'
  | 'RATING_BELOW_APPROVAL_THRESHOLD'
  | 'INVALID_OFFER_AUTHOR'
  | 'NOT_YOUR_TURN'
  | 'INVALID_RATING_RANGE'
  | 'ENTITY_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'INVALID_INPUT'
  | 'ALREADY_RATED'
  | 'OFFER_NOT_ACCEPTED';

export class DomainError extends Error {
  public readonly code: DomainErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(code: DomainErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, DomainError.prototype);
  }
}
