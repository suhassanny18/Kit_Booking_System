import { UserRepository } from '../UserRepository';
import { User } from '../../domain/entities/User';

export class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  findById(id: string): User | undefined {
    return this.users.get(id);
  }

  save(user: User): void {
    this.users.set(user.id, user);
  }

  findAll(): User[] {
    return Array.from(this.users.values());
  }

  clear(): void {
    this.users.clear();
  }
}
