import { Owner } from '../domain/entities/Owner';

export interface OwnerRepository {
  findById(id: string): Owner | undefined;
  save(owner: Owner): void;
  findAll(): Owner[];
  clear(): void;
}
