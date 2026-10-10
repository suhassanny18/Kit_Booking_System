import { Kit } from '../entities/Kit';
import { Camera } from '../components/Camera';
import { Mic } from '../components/Mic';
import { Tripod } from '../components/Tripod';
import { Tier } from '../enums';
import { DomainError } from '../errors';
import { KitComponentFactory } from '../factories/KitComponentFactory';
import { PremiumKitFactory } from '../factories/PremiumKitFactory';
import { StandardKitFactory } from '../factories/StandardKitFactory';
import { BudgetKitFactory } from '../factories/BudgetKitFactory';

/**
 * Builder Pattern: KitBuilder
 * Fluent builder with strict validation on build().
 */
export class KitBuilder {
  private id?: string;
  private ownerId?: string;
  private tier?: Tier;
  private camera?: Camera;
  private mic?: Mic;
  private tripod?: Tripod;
  private totalQuantity?: number;
  private dailyPrice?: number; // in paise

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withOwnerId(ownerId: string): this {
    this.ownerId = ownerId;
    return this;
  }

  withTier(tier: Tier): this {
    this.tier = tier;
    return this;
  }

  withCamera(camera: Camera): this {
    this.camera = camera;
    return this;
  }

  withMic(mic: Mic): this {
    this.mic = mic;
    return this;
  }

  withTripod(tripod: Tripod): this {
    this.tripod = tripod;
    return this;
  }

  withComponentsFromFactory(factory: KitComponentFactory, kitId: string): this {
    this.tier = factory.getTier();
    this.camera = factory.createCamera(kitId);
    this.mic = factory.createMic(kitId);
    this.tripod = factory.createTripod(kitId);
    return this;
  }

  withTotalQuantity(quantity: number): this {
    this.totalQuantity = quantity;
    return this;
  }

  withDailyPrice(paise: number): this {
    this.dailyPrice = paise;
    return this;
  }

  build(): Kit {
    if (!this.id || this.id.trim().length === 0) {
      throw new DomainError('INVALID_INPUT', 'Kit id is required');
    }
    if (!this.ownerId || this.ownerId.trim().length === 0) {
      throw new DomainError('INVALID_INPUT', 'Kit ownerId is required');
    }
    if (!this.tier) {
      throw new DomainError('INVALID_INPUT', 'Kit tier is required');
    }
    if (!this.totalQuantity || this.totalQuantity <= 0 || !Number.isInteger(this.totalQuantity)) {
      throw new DomainError('INVALID_INPUT', 'Kit totalQuantity must be a positive integer');
    }
    if (!this.dailyPrice || this.dailyPrice <= 0) {
      throw new DomainError('INVALID_INPUT', 'Kit dailyPrice must be a positive number of paise');
    }

    // If components were not set explicitly, create them using the factory for this tier
    if (!this.camera || !this.mic || !this.tripod) {
      let factory: KitComponentFactory;
      switch (this.tier) {
        case Tier.PREMIUM:
          factory = new PremiumKitFactory();
          break;
        case Tier.STANDARD:
          factory = new StandardKitFactory();
          break;
        case Tier.BUDGET:
          factory = new BudgetKitFactory();
          break;
        default:
          throw new DomainError('INVALID_INPUT', `Unknown tier: ${this.tier}`);
      }
      this.camera = this.camera || factory.createCamera(this.id);
      this.mic = this.mic || factory.createMic(this.id);
      this.tripod = this.tripod || factory.createTripod(this.id);
    }

    return new Kit(
      this.id,
      this.ownerId,
      this.tier,
      this.camera,
      this.mic,
      this.tripod,
      this.totalQuantity,
      this.dailyPrice
    );
  }
}
