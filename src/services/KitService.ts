import { Kit } from '../domain/entities/Kit';
import { Tier } from '../domain/enums';
import { KitRepository } from '../repositories/KitRepository';
import { OwnerRepository } from '../repositories/OwnerRepository';
import { KitBuilder } from '../domain/builders/KitBuilder';
import { DomainError } from '../domain/errors';

export class KitService {
  constructor(
    private kitRepo: KitRepository,
    private ownerRepo: OwnerRepository
  ) {}

  addKit(ownerId: string, tier: Tier, quantity: number, dailyPricePaise: number, customId?: string): Kit {
    const owner = this.ownerRepo.findById(ownerId);
    if (!owner) {
      throw new DomainError('ENTITY_NOT_FOUND', `Owner with ID ${ownerId} not found`);
    }

    if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
      throw new DomainError('INVALID_INPUT', 'Quantity must be a positive integer');
    }

    if (!dailyPricePaise || dailyPricePaise <= 0) {
      throw new DomainError('INVALID_INPUT', 'Daily price must be a positive number of paise');
    }

    const kitId = customId || `KIT-${tier.slice(0, 3)}-${Date.now().toString(36).slice(-4)}`;

    const kit = new KitBuilder()
      .withId(kitId)
      .withOwnerId(ownerId)
      .withTier(tier)
      .withTotalQuantity(quantity)
      .withDailyPrice(dailyPricePaise)
      .build();

    this.kitRepo.save(kit);
    return kit;
  }

  getKit(id: string): Kit {
    const kit = this.kitRepo.findById(id);
    if (!kit) {
      throw new DomainError('ENTITY_NOT_FOUND', `Kit with ID ${id} not found`);
    }
    return kit;
  }

  listKits(): Kit[] {
    return this.kitRepo.findAll();
  }

  getKitsByOwner(ownerId: string): Kit[] {
    return this.kitRepo.findByOwnerId(ownerId);
  }
}
