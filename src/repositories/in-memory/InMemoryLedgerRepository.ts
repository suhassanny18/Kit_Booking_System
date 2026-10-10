import { LedgerRepository } from '../LedgerRepository';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';

export class InMemoryLedgerRepository implements LedgerRepository {
  private entries: LedgerEntry[] = [];

  save(entry: LedgerEntry): void {
    this.entries.push(entry);
  }

  findByBookingId(bookingId: string): LedgerEntry[] {
    return this.entries.filter((e) => e.bookingId === bookingId);
  }

  findAll(): LedgerEntry[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries = [];
  }
}
