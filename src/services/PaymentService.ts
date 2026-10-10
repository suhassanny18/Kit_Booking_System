import { User } from '../domain/entities/User';
import { Owner } from '../domain/entities/Owner';
import { Booking } from '../domain/entities/Booking';
import { LedgerEntry } from '../domain/entities/LedgerEntry';
import { LedgerAccount } from '../domain/enums';
import { ADVANCE_PCT } from '../domain/constants';
import { DomainError } from '../domain/errors';
import { LedgerRepository } from '../repositories/LedgerRepository';
import { ForfeitPolicy } from '../domain/strategies/ForfeitPolicy';
import { Clock } from '../domain/clock';

export class PaymentService {
  constructor(
    private ledgerRepo: LedgerRepository,
    private clock: Clock
  ) {}

  /**
   * Holds initial 20% advance in escrow from the user's wallet.
   */
  holdAdvance(user: User, bookingId: string, proposedPricePaise: number): number {
    const advance = Math.round(proposedPricePaise * ADVANCE_PCT);
    if (user.wallet < advance) {
      throw new DomainError(
        'INSUFFICIENT_FUNDS_FOR_ADVANCE',
        `Insufficient funds for 20% advance. Required: ₹${(advance / 100).toFixed(2)}, available: ₹${(user.wallet / 100).toFixed(2)}`
      );
    }

    user.debitWallet(advance);

    const now = this.clock.now();
    // User wallet debited
    this.ledgerRepo.save(
      new LedgerEntry(
        `LEDGER-${Date.now()}-1`,
        bookingId,
        LedgerAccount.USER,
        -advance,
        `HOLD_ADVANCE_USER_DEBIT (20% of ₹${(proposedPricePaise / 100).toFixed(2)})`,
        now
      )
    );

    // Escrow credited
    this.ledgerRepo.save(
      new LedgerEntry(
        `LEDGER-${Date.now()}-2`,
        bookingId,
        LedgerAccount.ESCROW,
        advance,
        `HOLD_ADVANCE_ESCROW_CREDIT`,
        now
      )
    );

    return advance;
  }

  /**
   * On approval, recompute advance as 20% of agreed price and adjust difference (KI-10).
   */
  adjustAdvanceOnApproval(user: User, booking: Booking): number {
    const agreedPrice = booking.agreedPrice;
    const newRequiredAdvance = Math.round(agreedPrice * ADVANCE_PCT);
    const oldAdvance = booking.advanceAmount;
    const diff = newRequiredAdvance - oldAdvance;
    const now = this.clock.now();

    if (diff > 0) {
      // Need more advance from user
      if (user.wallet < diff) {
        throw new DomainError(
          'INSUFFICIENT_FUNDS_FOR_ADVANCE',
          `Cannot approve: User has insufficient wallet funds to cover adjusted 20% advance on agreed price ₹${(agreedPrice / 100).toFixed(2)}. Needed additional ₹${(diff / 100).toFixed(2)}, available: ₹${(user.wallet / 100).toFixed(2)}`
        );
      }
      user.debitWallet(diff);
      this.ledgerRepo.save(
        new LedgerEntry(
          `LEDGER-${Date.now()}-ADJ1`,
          booking.id,
          LedgerAccount.USER,
          -diff,
          `ADJUST_ADVANCE_DEBIT (Additional 20% diff on agreed price)`,
          now
        )
      );
      this.ledgerRepo.save(
        new LedgerEntry(
          `LEDGER-${Date.now()}-ADJ2`,
          booking.id,
          LedgerAccount.ESCROW,
          diff,
          `ADJUST_ADVANCE_ESCROW_CREDIT`,
          now
        )
      );
    } else if (diff < 0) {
      // Refund excess advance back to user
      const refund = Math.abs(diff);
      user.creditWallet(refund);
      this.ledgerRepo.save(
        new LedgerEntry(
          `LEDGER-${Date.now()}-ADJ1`,
          booking.id,
          LedgerAccount.ESCROW,
          -refund,
          `ADJUST_ADVANCE_ESCROW_DEBIT (Refund excess advance)`,
          now
        )
      );
      this.ledgerRepo.save(
        new LedgerEntry(
          `LEDGER-${Date.now()}-ADJ2`,
          booking.id,
          LedgerAccount.USER,
          refund,
          `ADJUST_ADVANCE_USER_CREDIT (Refund excess advance)`,
          now
        )
      );
    }

    booking._setAdvanceAmount(newRequiredAdvance);
    return newRequiredAdvance;
  }

  /**
   * Pre-check settlement funds (KI-20): ensures user can pay agreedPrice - advance.
   */
  checkSettlementFunds(user: User, booking: Booking): void {
    const remainder = booking.agreedPrice - booking.advanceAmount;
    if (remainder > 0 && user.wallet < remainder) {
      throw new DomainError(
        'INSUFFICIENT_FUNDS_FOR_SETTLEMENT',
        `User wallet cannot cover final settlement of ₹${(remainder / 100).toFixed(2)} (agreed ₹${(booking.agreedPrice / 100).toFixed(2)} minus advance ₹${(booking.advanceAmount / 100).toFixed(2)}). Available: ₹${(user.wallet / 100).toFixed(2)}. Please top up.`
      );
    }
  }

  /**
   * Settles booking upon return.
   * "Settlement on return: charge agreedPrice - advance. If the result is negative, refund the difference to the user.
   * The owner receives the full agreed price, and the escrowed advance is released to the owner."
   */
  settle(user: User, owner: Owner, booking: Booking): void {
    const agreedPrice = booking.agreedPrice;
    const advance = booking.advanceAmount;
    const remainder = agreedPrice - advance;
    const now = this.clock.now();

    if (remainder > 0) {
      if (user.wallet < remainder) {
        throw new DomainError(
          'INSUFFICIENT_FUNDS_FOR_SETTLEMENT',
          `User wallet cannot cover final settlement of ₹${(remainder / 100).toFixed(2)}`
        );
      }
      user.debitWallet(remainder);
      this.ledgerRepo.save(
        new LedgerEntry(
          `LEDGER-${Date.now()}-SETTLE-USR`,
          booking.id,
          LedgerAccount.USER,
          -remainder,
          `SETTLEMENT_USER_REMAINDER_DEBIT`,
          now
        )
      );
    } else if (remainder < 0) {
      const refund = Math.abs(remainder);
      user.creditWallet(refund);
      this.ledgerRepo.save(
        new LedgerEntry(
          `LEDGER-${Date.now()}-SETTLE-USR`,
          booking.id,
          LedgerAccount.USER,
          refund,
          `SETTLEMENT_USER_SURPLUS_REFUND`,
          now
        )
      );
    }

    // Release advance from Escrow
    this.ledgerRepo.save(
      new LedgerEntry(
        `LEDGER-${Date.now()}-SETTLE-ESC`,
        booking.id,
        LedgerAccount.ESCROW,
        -advance,
        `SETTLEMENT_ESCROW_RELEASE`,
        now
      )
    );

    // Owner receives full agreed price
    owner.creditWallet(agreedPrice);
    this.ledgerRepo.save(
      new LedgerEntry(
        `LEDGER-${Date.now()}-SETTLE-OWN`,
        booking.id,
        LedgerAccount.OWNER,
        agreedPrice,
        `SETTLEMENT_OWNER_FULL_PAYOUT (Total agreed price ₹${(agreedPrice / 100).toFixed(2)})`,
        now
      )
    );

    booking._setAdvanceAmount(0);
  }

  /**
   * Forfeits or refunds advance upon rejection according to ForfeitPolicy (KI-09).
   */
  forfeitOrRefundOnRejection(user: User, owner: Owner, booking: Booking, policy: ForfeitPolicy): void {
    const advance = booking.advanceAmount;
    if (advance <= 0) return;

    const result = policy.onRejection(advance);
    const now = this.clock.now();

    // Release from escrow
    this.ledgerRepo.save(
      new LedgerEntry(
        `LEDGER-${Date.now()}-REJ-ESC`,
        booking.id,
        LedgerAccount.ESCROW,
        -advance,
        `REJECTION_ESCROW_RELEASE (${policy.name})`,
        now
      )
    );

    if (result.forfeitToOwner > 0) {
      owner.creditWallet(result.forfeitToOwner);
      this.ledgerRepo.save(
        new LedgerEntry(
          `LEDGER-${Date.now()}-REJ-OWN`,
          booking.id,
          LedgerAccount.OWNER,
          result.forfeitToOwner,
          `REJECTION_FORFEIT_CREDIT_TO_OWNER (Policy: ${policy.name})`,
          now
        )
      );
    }

    if (result.refundToUser > 0) {
      user.creditWallet(result.refundToUser);
      this.ledgerRepo.save(
        new LedgerEntry(
          `LEDGER-${Date.now()}-REJ-USR`,
          booking.id,
          LedgerAccount.USER,
          result.refundToUser,
          `REJECTION_REFUND_CREDIT_TO_USER (Policy: ${policy.name})`,
          now
        )
      );
    }

    booking._setAdvanceAmount(0);
  }

  /**
   * Forfeits or refunds advance upon cancellation according to ForfeitPolicy (KI-06, KI-09).
   */
  forfeitOrRefundOnCancellation(user: User, owner: Owner, booking: Booking, policy: ForfeitPolicy): void {
    const advance = booking.advanceAmount;
    if (advance <= 0) return;

    const result = policy.onCancellation(advance);
    const now = this.clock.now();

    // Release from escrow
    this.ledgerRepo.save(
      new LedgerEntry(
        `LEDGER-${Date.now()}-CNC-ESC`,
        booking.id,
        LedgerAccount.ESCROW,
        -advance,
        `CANCELLATION_ESCROW_RELEASE (${policy.name})`,
        now
      )
    );

    if (result.forfeitToOwner > 0) {
      owner.creditWallet(result.forfeitToOwner);
      this.ledgerRepo.save(
        new LedgerEntry(
          `LEDGER-${Date.now()}-CNC-OWN`,
          booking.id,
          LedgerAccount.OWNER,
          result.forfeitToOwner,
          `CANCELLATION_FORFEIT_CREDIT_TO_OWNER (Policy: ${policy.name})`,
          now
        )
      );
    }

    if (result.refundToUser > 0) {
      user.creditWallet(result.refundToUser);
      this.ledgerRepo.save(
        new LedgerEntry(
          `LEDGER-${Date.now()}-CNC-USR`,
          booking.id,
          LedgerAccount.USER,
          result.refundToUser,
          `CANCELLATION_REFUND_CREDIT_TO_USER (Policy: ${policy.name})`,
          now
        )
      );
    }

    booking._setAdvanceAmount(0);
  }

  /**
   * User wallet top up
   */
  topUp(user: User, amountPaise: number): void {
    if (amountPaise <= 0) {
      throw new DomainError('INVALID_INPUT', 'Top up amount must be positive');
    }
    user.creditWallet(amountPaise);
    const now = this.clock.now();
    this.ledgerRepo.save(
      new LedgerEntry(
        `LEDGER-${Date.now()}-TOPUP`,
        'TOPUP',
        LedgerAccount.USER,
        amountPaise,
        `USER_MANUAL_TOPUP (₹${(amountPaise / 100).toFixed(2)})`,
        now
      )
    );
  }
}
