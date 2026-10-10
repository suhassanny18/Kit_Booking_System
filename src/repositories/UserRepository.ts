import { User } from '../domain/entities/User';

export interface UserRepository {
  findById(id: string): User | undefined;
  save(user: User): void;
  findAll(): User[];
  clear(): void;
}
