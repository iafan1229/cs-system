export class ValidationUtil {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidTimeSlot(startTime: Date, endTime: Date, durationMinutes: number): boolean {
    const duration = endTime.getTime() - startTime.getTime();
    const expectedDuration = durationMinutes * 60 * 1000;
    return duration === expectedDuration && startTime < endTime;
  }
}

