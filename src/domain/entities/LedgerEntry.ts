import { LedgerAccount } from '../enums';

export class LedgerEntry {
  public readonly id: string;
  public readonly bookingId: string;
  public readonly account: LedgerAccount;
  public readonly amount: number; // in paise
  public readonly reason: string;
  public readonly timestamp: Date;

  constructor(
    id: string,
    bookingId: string,
    account: LedgerAccount,
    amountPaise: number,
    reason: string,
    timestamp: Date
  ) {
    this.id = id;
    this.bookingId = bookingId;
    this.account = account;
    this.amount = Math.round(amountPaise);
    this.reason = reason;
    this.timestamp = new Date(timestamp);
  }
}
