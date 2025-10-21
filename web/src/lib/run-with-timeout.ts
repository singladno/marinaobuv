import { spawn } from 'node:child_process';

/**
 * Run a command with a timeout
 * @param command The command to run
 * @param args Command arguments
 * @param timeoutMs Timeout in milliseconds
 * @param extraEnv Additional environment variables
 * @returns Promise that resolves when command completes or rejects on timeout/error
 */
export async function runWithTimeout(
  command: string,
  args: string[] = [],
  timeoutMs: number,
  extraEnv: Record<string, string> = {}
): Promise<void> {
  console.log(`$ ${command} ${args.join(' ')} (timeout: ${timeoutMs}ms)`);

  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      env: { ...process.env, ...extraEnv },
      stdio: 'inherit',
      // Force unbuffered output
      shell: false,
    });

    let isResolved = false;
    let timeoutId: NodeJS.Timeout | undefined;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    };

    const resolveOnce = () => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        resolve();
      }
    };

    const rejectOnce = (error: Error) => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        reject(error);
      }
    };

    // Set up timeout
    timeoutId = setTimeout(() => {
      console.log(
        `⏰ Command timed out after ${timeoutMs}ms, killing process...`
      );
      child.kill('SIGTERM');

      // Force kill after 5 seconds if SIGTERM doesn't work
      setTimeout(() => {
        if (!child.killed) {
          console.log('🔪 Force killing process...');
          child.kill('SIGKILL');
        }
      }, 5000);

      rejectOnce(new Error(`Command timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.on('close', code => {
      if (code === 0) {
        resolveOnce();
      } else {
        rejectOnce(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', error => {
      rejectOnce(error);
    });
  });
}
