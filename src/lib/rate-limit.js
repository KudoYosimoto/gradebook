export const MAX_FAILS = 5
export const WINDOW_MS = 15 * 60 * 1000

// globalThis — чтобы счётчик не сбрасывался при горячей перезагрузке в режиме разработки.
const store = globalThis.__loginFails ?? (globalThis.__loginFails = new Map())

export function lockedFor(key, now = Date.now()) {
  const entry = store.get(key)
  if (!entry) return 0
  if (now - entry.first > WINDOW_MS) {
    store.delete(key)
    return 0
  }
  return entry.count >= MAX_FAILS ? WINDOW_MS - (now - entry.first) : 0
}

export function registerFail(key, now = Date.now()) {
  const entry = store.get(key)
  if (!entry || now - entry.first > WINDOW_MS) {
    store.set(key, { count: 1, first: now })
  } else {
    entry.count += 1
  }
}

/** Успешный вход — сбрасываем счётчик. */
export function resetFails(key) {
  store.delete(key)
}
