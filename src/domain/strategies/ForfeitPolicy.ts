/**
 * Strategy Pattern: ForfeitPolicy
 * Determines how the held advance in escrow is disbursed upon rejection or cancellation.
 */
export interface ForfeitResult {
  forfeitToOwner: number; // in paise
  refundToUser: number; // in paise
}

export interface ForfeitPolicy {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  onRejection(advanceAmountPaise: number): ForfeitResult;
  onCancellation(advanceAmountPaise: number): ForfeitResult;
}

export class DefaultForfeitPolicy implements ForfeitPolicy {
  public readonly id = 'DEFAULT';
  public readonly name = 'Default Forfeit Policy (Owner Keeps Advance)';
  public readonly description = 'Advance is forfeited to the owner on both owner rejection and user cancellation.';

  onRejection(advanceAmountPaise: number): ForfeitResult {
    return {
      forfeitToOwner: Math.round(advanceAmountPaise),
      refundToUser: 0,
    };
  }

  onCancellation(advanceAmountPaise: number): ForfeitResult {
    return {
      forfeitToOwner: Math.round(advanceAmountPaise),
      refundToUser: 0,
    };
  }
}

export class RefundOnOwnerRejectionPolicy implements ForfeitPolicy {
  public readonly id = 'REFUND_ON_REJECTION';
  public readonly name = 'Refund On Owner Rejection (Protects User)';
  public readonly description = 'Advance is refunded to the user if the owner rejects; forfeited to owner if user cancels.';

  onRejection(advanceAmountPaise: number): ForfeitResult {
    return {
      forfeitToOwner: 0,
      refundToUser: Math.round(advanceAmountPaise),
    };
  }

  onCancellation(advanceAmountPaise: number): ForfeitResult {
    return {
      forfeitToOwner: Math.round(advanceAmountPaise),
      refundToUser: 0,
    };
  }
}
