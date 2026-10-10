import { KitRepository } from '../KitRepository';
import { Kit } from '../../domain/entities/Kit';

export class InMemoryKitRepository implements KitRepository {
  private kits: Map<string, Kit> = new Map();

  findById(id: string): Kit | undefined {
    return this.kits.get(id);
  }

  save(kit: Kit): void {
    this.kits.set(kit.id, kit);
  }

  findAll(): Kit[] {
    return Array.from(this.kits.values());
  }

  findByOwnerId(ownerId: string): Kit[] {
    return Array.from(this.kits.values()).filter((k) => k.ownerId === ownerId);
  }

  clear(): void {
    this.kits.clear();
  }
}
