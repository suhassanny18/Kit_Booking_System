import { Booking } from '../domain/entities/Booking';

export interface BookingRepository {
  findById(id: string): Booking | undefined;
  save(booking: Booking): void;
  findAll(): Booking[];
  findByUserId(userId: string): Booking[];
  findByOwnerId(ownerId: string): Booking[];
  findByKitId(kitId: string): Booking[];
  clear(): void;
}
