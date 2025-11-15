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
if (typeof window !== "undefined") {
  // @ts-ignore
  window.__GLOBAL_LOADER = { begin, done, getPending };
}
