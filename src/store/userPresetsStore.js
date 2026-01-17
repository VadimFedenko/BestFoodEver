import { useSyncExternalStore } from 'react';

// Separate storage from prefs to keep the main prefs payload small and stable.
const STORAGE_KEY = 'bfe_user_presets_v1';

function readJsonSafe(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJsonSafe(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function normalizePreset(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (!raw.id || !raw.name || !raw.settings) return null;
  if (!raw.settings.priorities || typeof raw.settings.priorities !== 'object') return null;
  return {
    id: String(raw.id),
    name: String(raw.name),
    settings: {
      priorities: { ...(raw.settings.priorities || {}) },
      priceUnit: raw.settings.priceUnit ?? 'per1000kcal',
      isOptimized: typeof raw.settings.isOptimized === 'boolean' ? raw.settings.isOptimized : true,
      tasteScoreMethod: raw.settings.tasteScoreMethod ?? 'taste_score',
      selectedZone: raw.settings.selectedZone ?? null,
    },
  };
}

function loadUserPresets() {
  const stored = readJsonSafe(STORAGE_KEY);
  const arr = Array.isArray(stored) ? stored : stored?.presets; // tolerate future shape
  if (!Array.isArray(arr)) return [];
  const out = [];
  for (const p of arr) {
    const normalized = normalizePreset(p);
    if (normalized) out.push(normalized);
  }
  return out;
}

function makeId() {
  return `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function createUserPresetsStore() {
  let state = { presets: loadUserPresets() };
  const listeners = new Set();

  const emit = () => {
    for (const l of listeners) l();
  };

  const setPresets = (next) => {
    state = { presets: next };
    writeJsonSafe(STORAGE_KEY, next);
    emit();
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getState() {
      return state;
    },
    addPreset({ name, settings }) {
      const trimmed = String(name || '').trim();
      if (!trimmed) return null;
      const preset = {
        id: makeId(),
        name: trimmed,
        settings: {
          priorities: { ...(settings?.priorities || {}) },
          priceUnit: settings?.priceUnit ?? 'per1000kcal',
          isOptimized: typeof settings?.isOptimized === 'boolean' ? settings.isOptimized : true,
          tasteScoreMethod: settings?.tasteScoreMethod ?? 'taste_score',
          selectedZone: settings?.selectedZone ?? null,
        },
      };
      setPresets([preset, ...state.presets]);
      return preset;
    },
    refreshFromStorage() {
      state = { presets: loadUserPresets() };
      emit();
    },
  };
}

export const userPresetsStore = createUserPresetsStore();

export const userPresetsActions = {
  addPreset: (payload) => userPresetsStore.addPreset(payload),
  refreshFromStorage: () => userPresetsStore.refreshFromStorage(),
};

export function useUserPresets() {
  return useSyncExternalStore(
    userPresetsStore.subscribe,
    () => userPresetsStore.getState().presets,
    () => userPresetsStore.getState().presets,
  );
}


