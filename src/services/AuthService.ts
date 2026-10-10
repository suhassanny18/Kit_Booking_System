import { User } from '../domain/entities/User';
import { Owner } from '../domain/entities/Owner';
import { UserRepository } from '../repositories/UserRepository';
import { OwnerRepository } from '../repositories/OwnerRepository';
import { DomainError } from '../domain/errors';

export class AuthService {
  constructor(
    private userRepo: UserRepository,
    private ownerRepo: OwnerRepository
  ) {}

  registerUser(name: string, initialWalletPaise: number = 0, initialRating: number = 3.0, ratingCount: number = 0): User {
    if (!name || name.trim().length === 0) {
      throw new DomainError('INVALID_INPUT', 'User name is required');
    }
    const id = `USR-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString(36).slice(-4)}`;
    const user = new User(id, name.trim(), initialWalletPaise, initialRating, ratingCount);
    this.userRepo.save(user);
    return user;
  }

  registerOwner(name: string, initialWalletPaise: number = 0): Owner {
    if (!name || name.trim().length === 0) {
      throw new DomainError('INVALID_INPUT', 'Owner name is required');
    }
    const id = `OWN-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString(36).slice(-4)}`;
    const owner = new Owner(id, name.trim(), initialWalletPaise);
    this.ownerRepo.save(owner);
    return owner;
  }

  getUser(id: string): User {
    const user = this.userRepo.findById(id);
    if (!user) {
      throw new DomainError('ENTITY_NOT_FOUND', `User with ID ${id} not found`);
    }
    return user;
  }

  getOwner(id: string): Owner {
    const owner = this.ownerRepo.findById(id);
    if (!owner) {
      throw new DomainError('ENTITY_NOT_FOUND', `Owner with ID ${id} not found`);
    }
    return owner;
  }

  listUsers(): User[] {
    return this.userRepo.findAll();
  }

  listOwners(): Owner[] {
    return this.ownerRepo.findAll();
  }
}
