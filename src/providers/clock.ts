export interface Clock {
  now(): Date
  nowMs(): number
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date()
  }
  nowMs(): number {
    return Date.now()
  }
}

export class FixedClock implements Clock {
  private currentTime: Date

  constructor(fixedDate: Date | string | number) {
    this.currentTime = new Date(fixedDate)
  }

  now(): Date {
    return new Date(this.currentTime)
  }

  nowMs(): number {
    return this.currentTime.getTime()
  }

  advance(ms: number): void {
    this.currentTime = new Date(this.currentTime.getTime() + ms)
  }

  setTime(newDate: Date | string | number): void {
    this.currentTime = new Date(newDate)
  }
}

export const systemClock = new SystemClock()
