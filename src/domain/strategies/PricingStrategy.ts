import { Kit } from '../entities/Kit';
import { Slot } from '../entities/Slot';
import { Tier } from '../enums';

/**
 * Strategy Pattern: PricingStrategy
 * Computes suggested opening price for a kit and slot.
 */
export interface PricingStrategy {
  name: string;
  compute(kit: Kit, slot: Slot): number; // in integer paise
}

export class FlatDailyPricing implements PricingStrategy {
  public readonly name = 'Flat Daily Pricing (1 Slot = 1x Daily)';

  compute(kit: Kit, _slot: Slot): number {
    return Math.round(kit.dailyPrice);
  }
}

export class TierMultiplierPricing implements PricingStrategy {
  public readonly name = 'Tier Multiplier Pricing (Premium x1.2, Standard x1.0, Budget x0.85)';

  compute(kit: Kit, _slot: Slot): number {
    let multiplier = 1.0;
    switch (kit.tier) {
      case Tier.PREMIUM:
        multiplier = 1.2;
        break;
      case Tier.STANDARD:
        multiplier = 1.0;
        break;
      case Tier.BUDGET:
        multiplier = 0.85;
        break;
    }
    return Math.round(kit.dailyPrice * multiplier);
  }
}
