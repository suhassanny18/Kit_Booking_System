import { BookingRepository } from '../BookingRepository';
import { Booking } from '../../domain/entities/Booking';

export class InMemoryBookingRepository implements BookingRepository {
  private bookings: Map<string, Booking> = new Map();

  findById(id: string): Booking | undefined {
    return this.bookings.get(id);
  }

  save(booking: Booking): void {
    this.bookings.set(booking.id, booking);
  }

  findAll(): Booking[] {
    return Array.from(this.bookings.values());
  }

  findByUserId(userId: string): Booking[] {
    return Array.from(this.bookings.values()).filter((b) => b.userId === userId);
  }

  findByOwnerId(ownerId: string): Booking[] {
    return Array.from(this.bookings.values()).filter((b) => b.ownerId === ownerId);
  }

  findByKitId(kitId: string): Booking[] {
    return Array.from(this.bookings.values()).filter((b) => b.kitId === kitId);
  }

  clear(): void {
    this.bookings.clear();
  }
}
