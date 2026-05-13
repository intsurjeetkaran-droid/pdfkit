import { exec } from 'child_process';
import logger from '../logger';

/**
 * Promisified exec with per-command timing.
 *
 * Every external tool call (LibreOffice, Ghostscript, pdftoppm) goes through
 * here so we always know exactly how long the shell process took.
 *
 * @param command  Shell command to run
 * @param timeoutMs  Max allowed runtime (default 180 s for heavy conversions)
 */
export const execCommand = (command: string, timeoutMs = 180_000): Promise<string> => {
  return new Promise((resolve, reject) => {
    const startMs = Date.now();

    // Log the command before running so we can correlate with OS-level metrics
    logger.info('⚙  exec start', { command: command.slice(0, 120) });

    exec(command, { timeout: timeoutMs }, (error, stdout, stderr) => {
      const elapsedMs = Date.now() - startMs;

      if (error) {
        logger.error('⚙  exec failed', {
          command: command.slice(0, 120),
          elapsedMs,
          error: error.message,
          stderr: stderr?.slice(0, 300)
        });
        return reject(new Error(`Command failed after ${elapsedMs}ms: ${error.message}\n${stderr}`));
      }

      logger.info('⚙  exec done', {
        command: command.slice(0, 120),
        elapsedMs
      });

      resolve(stdout);
    });
  });
};
