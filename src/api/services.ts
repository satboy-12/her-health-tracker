import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { apiRequest } from './client';
import {
  firebaseDashboardService,
  firebaseJournalService,
  firebaseNutritionService,
  firebasePeriodsService,
  firebaseProfileService,
  firebaseSymptomsService,
  firebaseWaterService,
  firebaseWellnessService,
} from './firebaseData';
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

function isFirebaseActive(): boolean {
  return Boolean(auth.currentUser);
}

export const authService = {
  login: (payload: LoginPayload) =>
    apiRequest<AuthResponse>('/api/auth/login', { method: 'POST', body: payload }),
  register: (payload: RegisterPayload) =>
    apiRequest<AuthResponse>('/api/auth/register', { method: 'POST', body: payload }),
  logout: async () => {
    if (isFirebaseActive()) {
      await signOut(auth);
      return;
    }
    return apiRequest<void>('/api/auth/logout', { method: 'POST' });
  },
};

export const dashboardService = {
  getSummary: () =>
    isFirebaseActive()
      ? firebaseDashboardService.getSummary()
      : apiRequest<DashboardSummary>('/api/dashboard'),
};

export const periodsService = {
  list: () =>
    isFirebaseActive()
      ? firebasePeriodsService.list()
      : apiRequest<PeriodRecord[]>('/api/periods'),
  create: (payload: Omit<PeriodRecord, 'id'>) =>
    isFirebaseActive()
      ? firebasePeriodsService.create(payload)
      : apiRequest<PeriodRecord>('/api/periods', { method: 'POST', body: payload }),
  update: (id: string, payload: Omit<PeriodRecord, 'id'>) =>
    isFirebaseActive()
      ? firebasePeriodsService.update(id, payload)
      : apiRequest<PeriodRecord>(`/api/periods/${encodeURIComponent(id)}`, {
          method: 'PUT',
          body: payload,
        }),
  remove: (id: string) =>
    isFirebaseActive()
      ? firebasePeriodsService.remove(id)
      : apiRequest<void>(`/api/periods/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

export const symptomsService = {
  list: () =>
    isFirebaseActive()
      ? firebaseSymptomsService.list()
      : apiRequest<PcosSymptomLog[]>('/api/symptoms'),
  create: (payload: Omit<PcosSymptomLog, 'id'>) =>
    isFirebaseActive()
      ? firebaseSymptomsService.create(payload)
      : apiRequest<PcosSymptomLog>('/api/symptoms', { method: 'POST', body: payload }),
  remove: (id: string) =>
    isFirebaseActive()
      ? firebaseSymptomsService.remove(id)
      : apiRequest<void>(`/api/symptoms/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

export const wellnessService = {
  list: () =>
    isFirebaseActive()
      ? firebaseWellnessService.list()
      : apiRequest<WellnessEntry[]>('/api/wellness'),
  create: (payload: Omit<WellnessEntry, 'id'>) =>
    isFirebaseActive()
      ? firebaseWellnessService.create(payload)
      : apiRequest<WellnessEntry>('/api/wellness', { method: 'POST', body: payload }),
};

export const nutritionService = {
  getSummary: (date?: string) =>
    isFirebaseActive()
      ? firebaseNutritionService.getSummary(date)
      : apiRequest<NutritionSummaryResponse>(
          date ? `/api/nutrition?date=${encodeURIComponent(date)}` : '/api/nutrition',
        ),
  createMeal: (payload: Omit<NutritionMealItem, 'id'>) =>
    isFirebaseActive()
      ? firebaseNutritionService.createMeal(payload)
      : apiRequest<NutritionMealItem>('/api/nutrition', { method: 'POST', body: payload }),
  removeMeal: (id: string) =>
    isFirebaseActive()
      ? firebaseNutritionService.removeMeal(id)
      : apiRequest<void>(`/api/nutrition/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

export const waterService = {
  getStatus: (date?: string) =>
    isFirebaseActive()
      ? firebaseWaterService.getStatus(date)
      : apiRequest<WaterTrackerResponse>(
          date ? `/api/water?date=${encodeURIComponent(date)}` : '/api/water',
        ),
  logIntake: (payload: { date: string; amountMl: number }) =>
    isFirebaseActive()
      ? firebaseWaterService.logIntake(payload)
      : apiRequest<WaterIntakeRecord>('/api/water', { method: 'POST', body: payload }),
  updatePreferences: (payload: { dailyTargetMl?: number; remindersEnabled?: boolean }) =>
    isFirebaseActive()
      ? firebaseWaterService.updatePreferences(payload)
      : apiRequest<WaterTrackerResponse>('/api/water', { method: 'PUT', body: payload }),
};

export const journalService = {
  list: (query?: string) =>
    isFirebaseActive()
      ? firebaseJournalService.list(query)
      : apiRequest<JournalEntry[]>(
          query ? `/api/journal?q=${encodeURIComponent(query)}` : '/api/journal',
        ),
  create: (payload: Omit<JournalEntry, 'id'>) =>
    isFirebaseActive()
      ? firebaseJournalService.create(payload)
      : apiRequest<JournalEntry>('/api/journal', { method: 'POST', body: payload }),
  update: (id: string, payload: Omit<JournalEntry, 'id'>) =>
    isFirebaseActive()
      ? firebaseJournalService.update(id, payload)
      : apiRequest<JournalEntry>(`/api/journal/${encodeURIComponent(id)}`, {
          method: 'PUT',
          body: payload,
        }),
  remove: (id: string) =>
    isFirebaseActive()
      ? firebaseJournalService.remove(id)
      : apiRequest<void>(`/api/journal/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

export const profileService = {
  get: () =>
    isFirebaseActive() ? firebaseProfileService.get() : apiRequest<UserProfile>('/api/profile'),
  update: (payload: Partial<UserProfile>) =>
    isFirebaseActive()
      ? firebaseProfileService.update(payload)
      : apiRequest<UserProfile>('/api/profile', { method: 'PUT', body: payload }),
  deleteAccount: () =>
    isFirebaseActive()
      ? firebaseProfileService.deleteAccount()
      : apiRequest<void>('/api/profile', { method: 'DELETE' }),
};
