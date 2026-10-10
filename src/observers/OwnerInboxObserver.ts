import { BookingObserver, BookingEvent } from './BookingObserver';

export interface InboxMessage {
  id: string;
  bookingId: string;
  sender: string;
  message: string;
  timestamp: Date;
  read: boolean;
  eventType: string;
}

export class OwnerInboxObserver implements BookingObserver {
  public readonly name = 'OwnerInboxObserver';
  private inboxes: Map<string, InboxMessage[]> = new Map();

  onEvent(event: BookingEvent): void {
    const list = this.inboxes.get(event.ownerId) || [];
    const item: InboxMessage = {
      id: `MSG-OWNER-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      bookingId: event.bookingId,
      sender: event.actor,
      message: event.message,
      timestamp: new Date(event.timestamp),
      read: false,
      eventType: event.type,
    };
    list.unshift(item);
    this.inboxes.set(event.ownerId, list);
  }

  getInbox(ownerId: string): InboxMessage[] {
    return [...(this.inboxes.get(ownerId) || [])];
  }

  markRead(ownerId: string, messageId: string): void {
    const list = this.inboxes.get(ownerId);
    if (list) {
      const msg = list.find((m) => m.id === messageId);
      if (msg) msg.read = true;
    }
  }

  markAllRead(ownerId: string): void {
    const list = this.inboxes.get(ownerId);
    if (list) {
      list.forEach((m) => (m.read = true));
    }
  }

  clear(): void {
    this.inboxes.clear();
  }
}
