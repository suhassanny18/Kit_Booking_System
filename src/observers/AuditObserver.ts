import { BookingObserver, BookingEvent } from './BookingObserver';

export interface AuditLogEntry {
  id: string;
  eventType: string;
  timestamp: Date;
  bookingId: string;
  actor: string;
  message: string;
  isObserverFailure?: boolean;
}

export class AuditObserver implements BookingObserver {
  public readonly name = 'AuditObserver';
  private logs: AuditLogEntry[] = [];

  onEvent(event: BookingEvent): void {
    this.logs.unshift({
      id: `AUDIT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      eventType: event.type,
      timestamp: new Date(event.timestamp),
      bookingId: event.bookingId,
      actor: event.actor,
      message: event.message,
    });
  }

  logObserverFailure(observerName: string, error: Error, bookingId: string, timestamp: Date): void {
    this.logs.unshift({
      id: `AUDIT-ERR-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      eventType: 'OBSERVER_FAILURE',
      timestamp: new Date(timestamp),
      bookingId,
      actor: observerName,
      message: `Observer [${observerName}] failed: ${error.message}`,
      isObserverFailure: true,
    });
  }

  getLogs(): AuditLogEntry[] {
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
  }
}
