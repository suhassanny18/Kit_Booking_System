/**
 * Domain Enums for Kit Booking System
 */

export enum BookingStatus {
  REQUESTED = 'REQUESTED',
  NEGOTIATING = 'NEGOTIATING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PICKED_UP = 'PICKED_UP',
  RETURNED = 'RETURNED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ComponentType {
  CAMERA = 'CAMERA',
  MIC = 'MIC',
  TRIPOD = 'TRIPOD',
}

export enum Tier {
  PREMIUM = 'PREMIUM',
  STANDARD = 'STANDARD',
  BUDGET = 'BUDGET',
}

export enum ReturnCondition {
  PRISTINE = 'PRISTINE',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  DAMAGED = 'DAMAGED',
}

export enum BookingEventType {
  REQUESTED = 'REQUESTED',
  COUNTER_OFFER = 'COUNTER_OFFER',
  OFFER_ACCEPTED = 'OFFER_ACCEPTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PICKED_UP = 'PICKED_UP',
  RETURNED = 'RETURNED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ActorType {
  USER = 'USER',
  OWNER = 'OWNER',
}

export enum LedgerAccount {
  USER = 'USER',
  OWNER = 'OWNER',
  ESCROW = 'ESCROW',
}
