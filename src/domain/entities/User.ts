import { DomainError } from '../errors';

export class User {
  public readonly id: string;
  public readonly name: string;
  private _wallet: number; // in paise
  private _rating: number; // e.g. 3.0
  private _ratingCount: number;

  constructor(id: string, name: string, initialWalletPaise: number = 0, initialRating: number = 3.0, ratingCount: number = 0) {
    this.id = id;
    this.name = name;
    this._wallet = Math.round(initialWalletPaise);
    this._rating = initialRating;
    this._ratingCount = ratingCount;
  }

  get wallet(): number {
    return this._wallet;
  }

  get rating(): number {
    return this._rating;
  }

  get ratingCount(): number {
    return this._ratingCount;
  }

  creditWallet(amountPaise: number): void {
    if (amountPaise < 0) throw new DomainError('INVALID_INPUT', 'Cannot credit negative amount');
    this._wallet += Math.round(amountPaise);
  }

  debitWallet(amountPaise: number): void {
    const amt = Math.round(amountPaise);
    if (amt < 0) throw new DomainError('INVALID_INPUT', 'Cannot debit negative amount');
    if (this._wallet < amt) {
      throw new DomainError('INSUFFICIENT_FUNDS_FOR_ADVANCE', `Insufficient wallet balance. Required: ₹${(amt / 100).toFixed(2)}, available: ₹${(this._wallet / 100).toFixed(2)}`);
    }
    this._wallet -= amt;
  }

  /**
   * Applies owner rating.
   * "The first rating replaces the default 3.0. Later ratings use a running average."
   */
  applyRating(adjustedScore: number): void {
    if (this._ratingCount === 0) {
      this._rating = Number(adjustedScore.toFixed(2));
      this._ratingCount = 1;
    } else {
      const total = this._rating * this._ratingCount + adjustedScore;
      this._ratingCount += 1;
      this._rating = Number((total / this._ratingCount).toFixed(2));
    }
  }

  clone(): User {
    return new User(this.id, this.name, this._wallet, this._rating, this._ratingCount);
  }
}
