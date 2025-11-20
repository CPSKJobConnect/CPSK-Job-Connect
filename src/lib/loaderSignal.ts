// Minimal global loader signal registry.
// Usage: call begin() when starting async work and done() when finished.

type Listener = (count: number) => void;

const listeners = new Set<Listener>();
let pending = 0;

export function begin() {
  pending += 1;
  notify();
}

export function done() {
  pending = Math.max(0, pending - 1);
  notify();
}

export function getPending() {
  return pending;
}

export function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function notify() {
  for (const l of Array.from(listeners)) l(pending);
}

// Optional global access for quick usage in non-module code
// Avoid direct assignment to `window`/`globalThis` (may clobber DOM globals).
// Use a uniquely-named property and `Object.defineProperty` if needed.
if (typeof globalThis !== "undefined") {
  const globalKey = "__CPSK_JOB_CONNECT_LOADER";
  try {
    const g = globalThis as any;
    if (!g[globalKey]) {
      Object.defineProperty(g, globalKey, {
        value: { begin, done, getPending },
        writable: true,
        configurable: true,
        enumerable: false,
      });
    }
  } catch (e) {
    // best-effort: if defineProperty fails, do nothing
    // the module exports still provide the functions for imports
  }
}
