import { BookingObserver, BookingEvent } from './BookingObserver';
import { InboxMessage } from './OwnerInboxObserver';

export class UserInboxObserver implements BookingObserver {
  public readonly name = 'UserInboxObserver';
  private inboxes: Map<string, InboxMessage[]> = new Map();

  onEvent(event: BookingEvent): void {
    const list = this.inboxes.get(event.userId) || [];
    const item: InboxMessage = {
      id: `MSG-USER-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      bookingId: event.bookingId,
      sender: event.actor,
      message: event.message,
      timestamp: new Date(event.timestamp),
      read: false,
      eventType: event.type,
    };
    list.unshift(item);
    this.inboxes.set(event.userId, list);
  }

  getInbox(userId: string): InboxMessage[] {
    return [...(this.inboxes.get(userId) || [])];
  }

  markRead(userId: string, messageId: string): void {
    const list = this.inboxes.get(userId);
    if (list) {
      const msg = list.find((m) => m.id === messageId);
      if (msg) msg.read = true;
    }
  }

  markAllRead(userId: string): void {
    const list = this.inboxes.get(userId);
    if (list) {
      list.forEach((m) => (m.read = true));
    }
  }

  clear(): void {
    this.inboxes.clear();
  }
}
