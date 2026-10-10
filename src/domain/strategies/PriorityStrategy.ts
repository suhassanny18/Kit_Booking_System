import { Booking } from '../entities/Booking';
import { User } from '../entities/User';

/**
 * Strategy Pattern: PriorityStrategy
 * Sorts pending owner requests.
 */
export interface PriorityStrategy {
  name: string;
  sort(bookings: Booking[], userMap: Map<string, User>): Booking[];
}

export class RatingPriorityStrategy implements PriorityStrategy {
  public readonly name = 'Rating Priority (Highest User Rating First)';

  sort(bookings: Booking[], userMap: Map<string, User>): Booking[] {
    return [...bookings].sort((a, b) => {
      const userA = userMap.get(a.userId);
      const userB = userMap.get(b.userId);
      const ratingA = userA ? userA.rating : 0;
      const ratingB = userB ? userB.rating : 0;

      // Higher rating first. If equal rating, earlier createdAt first.
      if (ratingB !== ratingA) {
        return ratingB - ratingA;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }
}
