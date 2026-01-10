export interface UserSettings {
  email: string;
  emergencyEmail: string;
  alertThresholdHours: number; // 24 or 48
}

export interface UserState {
  isAuthenticated: boolean;
  lastCheckIn: number | null; // Timestamp
  settings: UserSettings;
}

export enum View {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  SETTINGS = 'SETTINGS',
}