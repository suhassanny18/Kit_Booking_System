import { OwnerRepository } from '../OwnerRepository';
import { Owner } from '../../domain/entities/Owner';

export class InMemoryOwnerRepository implements OwnerRepository {
  private owners: Map<string, Owner> = new Map();

  findById(id: string): Owner | undefined {
    return this.owners.get(id);
  }

  save(owner: Owner): void {
    this.owners.set(owner.id, owner);
  }

  findAll(): Owner[] {
    return Array.from(this.owners.values());
  }

  clear(): void {
    this.owners.clear();
  }
}
