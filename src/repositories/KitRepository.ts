import { Kit } from '../domain/entities/Kit';

export interface KitRepository {
  findById(id: string): Kit | undefined;
  save(kit: Kit): void;
  findAll(): Kit[];
  findByOwnerId(ownerId: string): Kit[];
  clear(): void;
}
