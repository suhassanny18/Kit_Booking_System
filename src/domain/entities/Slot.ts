/**
 * Immutable time slot with half-open [start, end) interval overlap check.
 * Slot ending at 12:00 does NOT overlap one starting at 12:00.
 */
export class Slot {
  public readonly start: Date;
  public readonly end: Date;

  constructor(start: Date | string, end: Date | string) {
    this.start = new Date(start);
    this.end = new Date(end);

    if (isNaN(this.start.getTime()) || isNaN(this.end.getTime())) {
      throw new Error('Invalid slot date values');
    }
    if (this.start.getTime() >= this.end.getTime()) {
      throw new Error('Slot start time must be strictly before end time');
    }
  }

  /**
   * Half-open interval overlap check:
   * [A_start, A_end) overlaps [B_start, B_end) iff A_start < B_end and B_start < A_end
   */
  overlaps(other: Slot): boolean {
    return this.start.getTime() < other.end.getTime() && other.start.getTime() < this.end.getTime();
  }

  toISOString(): string {
    return `${this.start.toISOString()}_${this.end.toISOString()}`;
  }

  equals(other: Slot): boolean {
    return this.start.getTime() === other.start.getTime() && this.end.getTime() === other.end.getTime();
  }

  formatDate(): string {
    return this.start.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  formatTimeRange(): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const sH = pad(this.start.getHours());
    const sM = pad(this.start.getMinutes());
    const eH = pad(this.end.getHours());
    const eM = pad(this.end.getMinutes());
    return `${sH}:${sM} - ${eH}:${eM}`;
  }

  formatDisplay(): string {
    return `${this.formatDate()} (${this.formatTimeRange()})`;
  }
}
