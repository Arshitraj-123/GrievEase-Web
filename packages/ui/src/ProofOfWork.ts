/**
 * Self-hosted Proof of Work client-side solver.
 * Finds a string counter such that SHA-256(nonce + counter) starts with `difficulty` number of '0' characters.
 * Runs in background or Web Worker so the browser UI doesn't freeze.
 */

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function solveChallenge(
  nonce: string,
  difficulty: number,
  onProgress?: (attempts: number) => void
): Promise<string> {
  const prefix = '0'.repeat(difficulty);
  let counter = 0;

  while (true) {
    const candidate = counter.toString();
    const hash = await sha256(nonce + candidate);
    if (hash.startsWith(prefix)) {
      return candidate;
    }
    counter++;
    if (counter % 1000 === 0 && onProgress) {
      onProgress(counter);
      // Yield to event loop to avoid UI lockup if not in worker
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
}

/**
 * Creates an inline Web Worker to solve the PoW asynchronously.
 */
export function solveChallengeInWorker(
  nonce: string,
  difficulty: number
): Promise<string> {
  if (typeof window === 'undefined') {
    return solveChallenge(nonce, difficulty);
  }

  return new Promise<string>((resolve, reject) => {

    const workerCode = `
      self.onmessage = async function(e) {
        const { nonce, difficulty } = e.data;
        const prefix = '0'.repeat(difficulty);
        let counter = 0;
        
        while (true) {
          const candidate = counter.toString();
          const msgBuffer = new TextEncoder().encode(nonce + candidate);
          const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          
          if (hash.startsWith(prefix)) {
            self.postMessage({ solution: candidate });
            break;
          }
          counter++;
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));

    worker.onmessage = (e) => {
      resolve(e.data.solution);
      worker.terminate();
    };

    worker.onerror = (err) => {
      reject(err);
      worker.terminate();
    };

    worker.postMessage({ nonce, difficulty });
  });
}
