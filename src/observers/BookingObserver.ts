import { BookingEventType, ActorType } from '../domain/enums';

export interface BookingEvent {
  id: string;
  type: BookingEventType;
  bookingId: string;
  userId: string;
  ownerId: string;
  actor: string;
  actorType: ActorType;
  timestamp: Date;
  message: string;
  payload?: Record<string, unknown>;
}

export interface BookingObserver {
  name: string;
  onEvent(event: BookingEvent): void;
}
