/**
 * Lightweight per-operation timer.
 * Logs step-by-step timing so you can see exactly how long each phase takes.
 */
export class Timer {
  private readonly operation: string;
  private readonly startMs: number;
  private lastMs: number;
  private readonly steps: Array<{ name: string; durationMs: number; cumulativeMs: number }> = [];

  constructor(operation: string) {
    this.operation = operation;
    this.startMs = Date.now();
    this.lastMs  = this.startMs;
  }

  step(name: string): void {
    const now = Date.now();
    this.steps.push({ name, durationMs: now - this.lastMs, cumulativeMs: now - this.startMs });
    this.lastMs = now;
  }

  elapsed(): number {
    return Date.now() - this.startMs;
  }

  summary(extra?: Record<string, unknown>): Record<string, unknown> {
    const totalMs = this.elapsed();
    return {
      operation: this.operation,
      totalMs,
      totalSec: (totalMs / 1000).toFixed(2),
      steps: this.steps.map((s) => ({ step: s.name, ms: s.durationMs, cumulative: s.cumulativeMs })),
      ...extra
    };
  }
}
