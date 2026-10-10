/**
 * Clock abstraction for time injection (KI-24)
 */

export interface Clock {
  now(): Date;
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

export class DemoClock implements Clock {
  private currentTime: Date;

  constructor(initialTime?: Date) {
    this.currentTime = initialTime ? new Date(initialTime.getTime()) : new Date('2026-10-10T09:00:00.000Z');
  }

  now(): Date {
    return new Date(this.currentTime.getTime());
  }

  advanceMinutes(minutes: number): Date {
    this.currentTime = new Date(this.currentTime.getTime() + minutes * 60 * 1000);
    return this.now();
  }

  setTime(time: Date): void {
    this.currentTime = new Date(time.getTime());
  }
}
