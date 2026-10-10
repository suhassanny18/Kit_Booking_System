import { DomainError } from '../errors';

export class Owner {
  public readonly id: string;
  public readonly name: string;
  private _wallet: number; // in paise

  constructor(id: string, name: string, initialWalletPaise: number = 0) {
    this.id = id;
    this.name = name;
    this._wallet = Math.round(initialWalletPaise);
  }

  get wallet(): number {
    return this._wallet;
  }

  creditWallet(amountPaise: number): void {
    const amt = Math.round(amountPaise);
    if (amt < 0) throw new DomainError('INVALID_INPUT', 'Cannot credit negative amount');
    this._wallet += amt;
  }

  debitWallet(amountPaise: number): void {
    const amt = Math.round(amountPaise);
    if (amt < 0) throw new DomainError('INVALID_INPUT', 'Cannot debit negative amount');
    if (this._wallet < amt) {
      throw new DomainError('INVALID_INPUT', 'Owner has insufficient balance to debit');
    }
    this._wallet -= amt;
  }

  clone(): Owner {
    return new Owner(this.id, this.name, this._wallet);
  }
}
