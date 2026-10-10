import { LedgerEntry } from '../domain/entities/LedgerEntry';

export interface LedgerRepository {
  save(entry: LedgerEntry): void;
  findByBookingId(bookingId: string): LedgerEntry[];
  findAll(): LedgerEntry[];
  clear(): void;
}
