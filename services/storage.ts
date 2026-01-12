import { UserState } from '../types';

const STORAGE_KEY = 'still_alive_data';
const LOGS_KEY = 'still_alive_logs';

const DEFAULT_STATE: UserState = {
  isAuthenticated: false,
  lastCheckIn: null,
  settings: {
    email: '',
    emergencyEmail: '',
    alertThresholdHours: 24,
  },
};

/**
 * Persist the entire user state (including lastCheckIn and settings)
 */
export const saveState = (state: UserState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state:", e);
  }
};

/**
 * Load user state from localStorage
 */
export const loadState = (): UserState => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return DEFAULT_STATE;
    
    const parsed = JSON.parse(data);
    // Merge with default to ensure all fields exist (migration safety)
    return { ...DEFAULT_STATE, ...parsed, settings: { ...DEFAULT_STATE.settings, ...parsed.settings } };
  } catch (e) {
    console.error("Failed to load state:", e);
    return DEFAULT_STATE;
  }
};

/**
 * Persist logs array
 */
export const saveLogs = (logs: string[]) => {
  try {
    // Limit storage to last 100 logs to prevent overflow
    const trimmedLogs = logs.slice(-100);
    localStorage.setItem(LOGS_KEY, JSON.stringify(trimmedLogs));
  } catch (e) {
    console.error("Failed to save logs:", e);
  }
};

/**
 * Load logs from localStorage
 */
export const loadLogs = (): string[] => {
  try {
    const data = localStorage.getItem(LOGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

/**
 * Determine the current safety status
 */
export const checkStatusLogic = (lastCheckIn: number | null, thresholdHours: number): 'SAFE' | 'ALERT_TRIGGERED' | 'NO_DATA' => {
  if (!lastCheckIn) return "NO_DATA";
  
  const now = Date.now();
  const diffMs = now - lastCheckIn;
  const thresholdMs = thresholdHours * 60 * 60 * 1000;

  if (diffMs > thresholdMs) {
    return "ALERT_TRIGGERED";
  }
  return "SAFE";
};

/**
 * Helper to clear data (useful for debugging or logout)
 */
export const clearData = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LOGS_KEY);
};