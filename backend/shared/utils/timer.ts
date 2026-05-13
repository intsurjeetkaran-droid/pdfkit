/**
 * Lightweight process-timer utility.
 * Every service imports this to get consistent, structured timing logs.
 *
 * Usage:
 *   const t = new Timer('pdf-merge');
 *   t.step('load-files');          // marks a checkpoint
 *   t.step('copy-pages');
 *   t.done({ outputPath });        // logs full breakdown + total
 */

export interface TimerStep {
  name: string;
  durationMs: number;
  cumulativeMs: number;
}

export class Timer {
  private readonly operation: string;
  private readonly startMs: number;
  private lastMs: number;
  private readonly steps: TimerStep[] = [];

  constructor(operation: string) {
    this.operation = operation;
    this.startMs = Date.now();
    this.lastMs = this.startMs;
  }

  /** Record a named checkpoint — logs time since last step */
  step(name: string): void {
    const now = Date.now();
    const durationMs = now - this.lastMs;
    const cumulativeMs = now - this.startMs;
    this.steps.push({ name, durationMs, cumulativeMs });
    this.lastMs = now;
  }

  /** Return total elapsed ms */
  elapsed(): number {
    return Date.now() - this.startMs;
  }

  /**
   * Return a structured summary object ready to pass to logger.info().
   * Includes per-step breakdown and total.
   */
  summary(extra?: Record<string, unknown>): Record<string, unknown> {
    const totalMs = this.elapsed();
    return {
      operation: this.operation,
      totalMs,
      totalSec: (totalMs / 1000).toFixed(2),
      steps: this.steps.map((s) => ({
        step: s.name,
        ms: s.durationMs,
        cumulative: s.cumulativeMs
      })),
      ...extra
    };
  }
}
