import { apiRequest } from './client';
import type {
  AuthResponse,
  DashboardSummary,
  JournalEntry,
  LoginPayload,
  NutritionMealItem,
  NutritionSummaryResponse,
  PcosSymptomLog,
  PeriodRecord,
  RegisterPayload,
  UserProfile,
  WaterIntakeRecord,
  WaterTrackerResponse,
  WellnessEntry,
} from '../types/api';

export const authService = {
  login: (payload: LoginPayload) =>
    apiRequest<AuthResponse>('/api/auth/login', { method: 'POST', body: payload }),
  register: (payload: RegisterPayload) =>
    apiRequest<AuthResponse>('/api/auth/register', { method: 'POST', body: payload }),
  logout: () => apiRequest<void>('/api/auth/logout', { method: 'POST' }),
};

export const dashboardService = {
  getSummary: () => apiRequest<DashboardSummary>('/api/dashboard'),
};

export const periodsService = {
  list: () => apiRequest<PeriodRecord[]>('/api/periods'),
  create: (payload: Omit<PeriodRecord, 'id'>) =>
    apiRequest<PeriodRecord>('/api/periods', { method: 'POST', body: payload }),
  update: (id: string, payload: Omit<PeriodRecord, 'id'>) =>
    apiRequest<PeriodRecord>(`/api/periods/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: payload,
    }),
  remove: (id: string) =>
    apiRequest<void>(`/api/periods/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

export const symptomsService = {
  list: () => apiRequest<PcosSymptomLog[]>('/api/symptoms'),
  create: (payload: Omit<PcosSymptomLog, 'id'>) =>
    apiRequest<PcosSymptomLog>('/api/symptoms', { method: 'POST', body: payload }),
  remove: (id: string) =>
    apiRequest<void>(`/api/symptoms/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

export const wellnessService = {
  list: () => apiRequest<WellnessEntry[]>('/api/wellness'),
  create: (payload: Omit<WellnessEntry, 'id'>) =>
    apiRequest<WellnessEntry>('/api/wellness', { method: 'POST', body: payload }),
};

export const nutritionService = {
  getSummary: (date?: string) =>
    apiRequest<NutritionSummaryResponse>(
      date ? `/api/nutrition?date=${encodeURIComponent(date)}` : '/api/nutrition',
    ),
  createMeal: (payload: Omit<NutritionMealItem, 'id'>) =>
    apiRequest<NutritionMealItem>('/api/nutrition', { method: 'POST', body: payload }),
  removeMeal: (id: string) =>
    apiRequest<void>(`/api/nutrition/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

export const waterService = {
  getStatus: (date?: string) =>
    apiRequest<WaterTrackerResponse>(
      date ? `/api/water?date=${encodeURIComponent(date)}` : '/api/water',
    ),
  logIntake: (payload: { date: string; amountMl: number }) =>
    apiRequest<WaterIntakeRecord>('/api/water', { method: 'POST', body: payload }),
  updatePreferences: (payload: { dailyTargetMl?: number; remindersEnabled?: boolean }) =>
    apiRequest<WaterTrackerResponse>('/api/water', { method: 'PUT', body: payload }),
};

export const journalService = {
  list: (query?: string) =>
    apiRequest<JournalEntry[]>(
      query ? `/api/journal?q=${encodeURIComponent(query)}` : '/api/journal',
    ),
  create: (payload: Omit<JournalEntry, 'id'>) =>
    apiRequest<JournalEntry>('/api/journal', { method: 'POST', body: payload }),
  update: (id: string, payload: Omit<JournalEntry, 'id'>) =>
    apiRequest<JournalEntry>(`/api/journal/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: payload,
    }),
  remove: (id: string) =>
    apiRequest<void>(`/api/journal/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

export const profileService = {
  get: () => apiRequest<UserProfile>('/api/profile'),
  update: (payload: Partial<UserProfile>) =>
    apiRequest<UserProfile>('/api/profile', { method: 'PUT', body: payload }),
  deleteAccount: () => apiRequest<void>('/api/profile', { method: 'DELETE' }),
};
