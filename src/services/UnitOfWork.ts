import { User } from '../domain/entities/User';
import { Owner } from '../domain/entities/Owner';
import { Booking } from '../domain/entities/Booking';
import { UserRepository } from '../repositories/UserRepository';
import { OwnerRepository } from '../repositories/OwnerRepository';
import { BookingRepository } from '../repositories/BookingRepository';
import { LedgerRepository } from '../repositories/LedgerRepository';
import { LedgerEntry } from '../domain/entities/LedgerEntry';

/**
 * UnitOfWork Pattern (KI-19)
 * Snapshots affected entities before mutation and rolls back repository state on any error.
 */
export class UnitOfWork {
  constructor(
    private userRepo: UserRepository,
    private ownerRepo: OwnerRepository,
    private bookingRepo: BookingRepository,
    private ledgerRepo: LedgerRepository
  ) {}

  execute<T>(operation: () => T): T {
    // 1. Take snapshots of current state
    const userSnapshots = new Map<string, User>();
    for (const u of this.userRepo.findAll()) {
      userSnapshots.set(u.id, u.clone());
    }

    const ownerSnapshots = new Map<string, Owner>();
    for (const o of this.ownerRepo.findAll()) {
      ownerSnapshots.set(o.id, o.clone());
    }

    const bookingSnapshots = new Map<string, Booking>();
    for (const b of this.bookingRepo.findAll()) {
      bookingSnapshots.set(b.id, b.clone());
    }

    const ledgerCount = this.ledgerRepo.findAll().length;

    try {
      return operation();
    } catch (err) {
      // Rollback on any exception
      for (const [id, user] of userSnapshots.entries()) {
        this.userRepo.save(user);
      }
      for (const [id, owner] of ownerSnapshots.entries()) {
        this.ownerRepo.save(owner);
      }
      for (const [id, booking] of bookingSnapshots.entries()) {
        this.bookingRepo.save(booking);
      }
      // If new bookings were added that didn't exist before, remove them
      const currentBookings = this.bookingRepo.findAll();
      for (const b of currentBookings) {
        if (!bookingSnapshots.has(b.id)) {
          // Remove new booking
          // Since InMemory doesn't have delete, we can clear and restore
        }
      }
      // Restore exact booking collection
      this.bookingRepo.clear();
      for (const b of bookingSnapshots.values()) {
        this.bookingRepo.save(b);
      }

      // Restore exact ledger collection
      const ledgerEntries = this.ledgerRepo.findAll().slice(0, ledgerCount);
      this.ledgerRepo.clear();
      for (const e of ledgerEntries) {
        this.ledgerRepo.save(e);
      }

      throw err;
    }
  }
}
