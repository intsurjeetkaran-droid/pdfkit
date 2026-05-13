import { exec } from 'child_process';
import logger from '../logger';

/**
 * Promisified exec with per-command timing.
 * Every qpdf call goes through here so we always know how long it took.
 */
export const execCommand = (command: string, timeoutMs = 120_000): Promise<string> => {
  return new Promise((resolve, reject) => {
    const startMs = Date.now();
    // Log the command (mask passwords in logs)
    const safeCmd = command.replace(/--password=[^\s]*/g, '--password=***');
    logger.info('⚙  exec start', { command: safeCmd });

    exec(command, { timeout: timeoutMs }, (error, stdout, stderr) => {
      const elapsedMs = Date.now() - startMs;

      if (error) {
        logger.error('⚙  exec failed', {
          command: safeCmd,
          elapsedMs,
          error: error.message,
          stderr: stderr?.slice(0, 300)
        });
        return reject(new Error(`Command failed after ${elapsedMs}ms: ${error.message}\n${stderr}`));
      }

      logger.info('⚙  exec done', { command: safeCmd, elapsedMs });
      resolve(stdout);
    });
  });
};
