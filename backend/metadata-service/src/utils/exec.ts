import { exec } from 'child_process';
import logger from '../logger';

/**
 * Promisified exec with per-command timing.
 * Every pdftoppm call goes through here so we always know how long it took.
 */
export const execCommand = (command: string, timeoutMs = 60_000): Promise<string> => {
  return new Promise((resolve, reject) => {
    const startMs = Date.now();
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

      logger.info('⚙  exec done', { command: command.slice(0, 120), elapsedMs });
      resolve(stdout);
    });
  });
};
