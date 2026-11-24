import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { deleteUser, signOut, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrors';
import {
  calculateCycleLengths,
  calculatePeriodEstimate,
  sumNutritionMacros,
} from '../utils/healthCalculations';
import {
  BLUEPRINT_LIMITS,
  BLUEPRINT_PATTERNS,
  sanitizeBoundedText,
  sanitizeSymptomList,
} from '../utils/validation';
import type {
  DashboardSummary,
  JournalEntry,
  NutritionMealItem,
  NutritionSummaryResponse,
  PcosSymptomLog,
  PeriodRecord,
  UserProfile,
  WaterIntakeRecord,
  WaterTrackerResponse,
  WellnessEntry,
} from '../types/api';

function requireUid(): string {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Authentication required for Firebase Firestore access.');
  }
  return user.uid;
}

function clampInt(val: number, min: number, max: number): number {
  const rounded = Math.round(Number(val) || 0);
  return Math.max(min, Math.min(max, rounded));
}

function clampNum(val: number, min: number, max: number): number {
  const num = Number(val) || 0;
  return Math.max(min, Math.min(max, Number(num.toFixed(2))));
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function getLast7Days(anchorDate: string): Array<{ date: string; label: string }> {
  const anchor = new Date(`${anchorDate}T00:00:00Z`);
  const result: Array<{ date: string; label: string }> = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(anchor);
    d.setUTCDate(anchor.getUTCDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
    result.push({ date: iso, label });
  }
  return result;
}

export async function ensureUserAccountAndProfile(fbUser: FirebaseUser): Promise<void> {
  const uid = fbUser.uid;
  const userPath = `users/${uid}`;
  const privatePath = `users/${uid}/private/profile`;

  const userRef = doc(db, 'users', uid);
  let userExists = false;
  try {
    const snap = await getDoc(userRef);
    userExists = snap.exists();
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, userPath);
  }

  if (!userExists) {
    const fallbackName =
      sanitizeBoundedText(fbUser.displayName, BLUEPRINT_LIMITS.FULL_NAME_MAX) ||
      sanitizeBoundedText(fbUser.email?.split('@')[0], BLUEPRINT_LIMITS.FULL_NAME_MAX) ||
      'Member';
    try {
      await setDoc(userRef, {
        userId: uid,
        fullName: fallbackName,
        memberSince: todayIsoDate(),
        accountTier: 'Firebase Cloud',
        cycleReminders: true,
        medicationAlerts: true,
        hydrationNudges: false,
        dailyCalorieTarget: 2000,
        dailyWaterTargetMl: 2500,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, userPath);
    }
  }

  const privateRef = doc(db, 'users', uid, 'private', 'profile');
  let privateExists = false;
  try {
    const snap = await getDoc(privateRef);
    privateExists = snap.exists();
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, privatePath);
  }

  if (!privateExists) {
    const safeEmail = sanitizeBoundedText(fbUser.email, BLUEPRINT_LIMITS.EMAIL_MAX);
    if (BLUEPRINT_PATTERNS.EMAIL.test(safeEmail)) {
      try {
        await setDoc(privateRef, {
          userId: uid,
          email: safeEmail,
          dateOfBirth: '',
          phoneNumber: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, privatePath);
      }
    }
  }
}

async function listOwnedDocs<T>(subcollection: string): Promise<Array<T & { id: string }>> {
  const uid = requireUid();
  const path = `users/${uid}/${subcollection}`;
  try {
    const q = query(collection(db, 'users', uid, subcollection), where('userId', '==', uid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      ...(d.data() as T),
      id: d.id,
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export const firebasePeriodsService = {
  async list(): Promise<PeriodRecord[]> {
    const rows = await listOwnedDocs<PeriodRecord>('periods');
    const sorted = [...rows].sort((a, b) => b.startDate.localeCompare(a.startDate));
    const lengths = calculateCycleLengths(sorted);
    return sorted.map((row, idx) => ({
      id: row.id,
      startDate: row.startDate,
      endDate: row.endDate,
      flowIntensity: row.flowIntensity,
      symptoms: Array.isArray(row.symptoms) ? row.symptoms : [],
      notes: row.notes || '',
      cycleLengthDays: idx < lengths.length ? lengths[lengths.length - 1 - idx] : undefined,
    }));
  },

  async create(payload: Omit<PeriodRecord, 'id'>): Promise<PeriodRecord> {
    const uid = requireUid();
    if (auth.currentUser) await ensureUserAccountAndProfile(auth.currentUser);
    const path = `users/${uid}/periods`;
    const body = {
      userId: uid,
      startDate: payload.startDate,
      endDate: payload.endDate,
      flowIntensity: payload.flowIntensity,
      symptoms: sanitizeSymptomList(payload.symptoms),
      notes: sanitizeBoundedText(payload.notes || '', BLUEPRINT_LIMITS.NOTES_MAX),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    try {
      const ref = await addDoc(collection(db, 'users', uid, 'periods'), body);
      return {
        id: ref.id,
        startDate: body.startDate,
        endDate: body.endDate,
        flowIntensity: body.flowIntensity,
        symptoms: body.symptoms,
        notes: body.notes,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  async update(id: string, payload: Omit<PeriodRecord, 'id'>): Promise<PeriodRecord> {
    const uid = requireUid();
    const path = `users/${uid}/periods/${id}`;
    const docRef = doc(db, 'users', uid, 'periods', id);
    const clean = {
      startDate: payload.startDate,
      endDate: payload.endDate,
      flowIntensity: payload.flowIntensity,
      symptoms: sanitizeSymptomList(payload.symptoms),
      notes: sanitizeBoundedText(payload.notes || '', BLUEPRINT_LIMITS.NOTES_MAX),
      updatedAt: serverTimestamp(),
    };
    try {
      await updateDoc(docRef, clean);
      return {
        id,
        startDate: clean.startDate,
        endDate: clean.endDate,
        flowIntensity: clean.flowIntensity,
        symptoms: clean.symptoms,
        notes: clean.notes,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  async remove(id: string): Promise<void> {
    const uid = requireUid();
    const path = `users/${uid}/periods/${id}`;
    try {
      await deleteDoc(doc(db, 'users', uid, 'periods', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },
};

export const firebaseSymptomsService = {
  async list(): Promise<PcosSymptomLog[]> {
    const rows = await listOwnedDocs<PcosSymptomLog>('symptoms');
    return rows
      .map((r) => ({
        id: r.id,
        date: r.date,
        symptoms: Array.isArray(r.symptoms) ? r.symptoms : [],
        severity: r.severity,
        painLevel: r.painLevel,
        energyLevel: r.energyLevel,
        observations: r.observations || '',
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  async create(payload: Omit<PcosSymptomLog, 'id'>): Promise<PcosSymptomLog> {
    const uid = requireUid();
    if (auth.currentUser) await ensureUserAccountAndProfile(auth.currentUser);
    const path = `users/${uid}/symptoms`;
    const body = {
      userId: uid,
      date: payload.date,
      symptoms: sanitizeSymptomList(payload.symptoms),
      severity: clampInt(payload.severity, 1, 5),
      painLevel: clampInt(payload.painLevel, 0, 10),
      energyLevel: clampInt(payload.energyLevel, 1, 5),
      observations: sanitizeBoundedText(payload.observations || '', BLUEPRINT_LIMITS.NOTES_MAX),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    try {
      const ref = await addDoc(collection(db, 'users', uid, 'symptoms'), body);
      return {
        id: ref.id,
        date: body.date,
        symptoms: body.symptoms,
        severity: body.severity,
        painLevel: body.painLevel,
        energyLevel: body.energyLevel,
        observations: body.observations,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  async remove(id: string): Promise<void> {
    const uid = requireUid();
    const path = `users/${uid}/symptoms/${id}`;
    try {
      await deleteDoc(doc(db, 'users', uid, 'symptoms', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },
};

export const firebaseWellnessService = {
  async list(): Promise<WellnessEntry[]> {
    const rows = await listOwnedDocs<WellnessEntry>('wellness');
    return rows
      .map((r) => ({
        id: r.id,
        date: r.date,
        mood: r.mood,
        sleepHours: r.sleepHours,
        sleepQuality: r.sleepQuality,
        stressLevel: r.stressLevel,
        notes: r.notes || '',
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  async create(payload: Omit<WellnessEntry, 'id'>): Promise<WellnessEntry> {
    const uid = requireUid();
    if (auth.currentUser) await ensureUserAccountAndProfile(auth.currentUser);
    const path = `users/${uid}/wellness`;
    const body = {
      userId: uid,
      date: payload.date,
      mood: payload.mood,
      sleepHours: clampNum(payload.sleepHours, 0, 24),
      sleepQuality: payload.sleepQuality,
      stressLevel: clampInt(payload.stressLevel, 1, 10),
      notes: sanitizeBoundedText(payload.notes || '', BLUEPRINT_LIMITS.NOTES_MAX),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    try {
      const ref = await addDoc(collection(db, 'users', uid, 'wellness'), body);
      return {
        id: ref.id,
        date: body.date,
        mood: body.mood,
        sleepHours: body.sleepHours,
        sleepQuality: body.sleepQuality,
        stressLevel: body.stressLevel,
        notes: body.notes,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },
};

export const firebaseNutritionService = {
  async getSummary(date?: string): Promise<NutritionSummaryResponse> {
    const uid = requireUid();
    if (auth.currentUser) await ensureUserAccountAndProfile(auth.currentUser);
    const activeDate = date || todayIsoDate();

    let calorieTarget = 2000;
    try {
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (userSnap.exists()) {
        const d = userSnap.data();
        if (typeof d.dailyCalorieTarget === 'number') {
          calorieTarget = d.dailyCalorieTarget;
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${uid}`);
    }

    const allMeals = await listOwnedDocs<NutritionMealItem>('nutrition');
    const mealsForDate = allMeals.filter((m) => m.date === activeDate);
    const days = getLast7Days(activeDate);

    const weeklyTotals = days.map(({ date: dIso, label }) => {
      const dayMeals = allMeals.filter((m) => m.date === dIso);
      const calories = dayMeals.reduce((sum, m) => sum + (Number(m.calories) || 0), 0);
      const status =
        calories === 0 ? 'No logs' : calories <= calorieTarget ? 'Within target' : 'Over target';
      return { date: dIso, label, calories: Math.round(calories), status };
    });

    return {
      date: activeDate,
      targets: {
        calories: calorieTarget,
        proteinGrams: 110,
        carbsGrams: 220,
        fatGrams: 65,
        fiberGrams: 30,
      },
      meals: mealsForDate,
      weeklyTotals,
    };
  },

  async createMeal(payload: Omit<NutritionMealItem, 'id'>): Promise<NutritionMealItem> {
    const uid = requireUid();
    if (auth.currentUser) await ensureUserAccountAndProfile(auth.currentUser);
    const path = `users/${uid}/nutrition`;
    const body = {
      userId: uid,
      date: payload.date,
      mealType: payload.mealType,
      foodName: sanitizeBoundedText(payload.foodName, BLUEPRINT_LIMITS.FOOD_NAME_MAX),
      portion: sanitizeBoundedText(payload.portion, BLUEPRINT_LIMITS.PORTION_MAX),
      calories: clampNum(payload.calories, 0, 10000),
      proteinGrams: clampNum(payload.proteinGrams, 0, 1000),
      carbsGrams: clampNum(payload.carbsGrams, 0, 1000),
      fatGrams: clampNum(payload.fatGrams, 0, 1000),
      fiberGrams: clampNum(payload.fiberGrams, 0, 1000),
      loggedTime: sanitizeBoundedText(
        payload.loggedTime || new Date().toTimeString().slice(0, 5),
        40,
      ),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    try {
      const ref = await addDoc(collection(db, 'users', uid, 'nutrition'), body);
      return {
        id: ref.id,
        date: body.date,
        mealType: body.mealType,
        foodName: body.foodName,
        portion: body.portion,
        calories: body.calories,
        proteinGrams: body.proteinGrams,
        carbsGrams: body.carbsGrams,
        fatGrams: body.fatGrams,
        fiberGrams: body.fiberGrams,
        loggedTime: body.loggedTime,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  async removeMeal(id: string): Promise<void> {
    const uid = requireUid();
    const path = `users/${uid}/nutrition/${id}`;
    try {
      await deleteDoc(doc(db, 'users', uid, 'nutrition', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },
};

export const firebaseWaterService = {
  async getStatus(date?: string): Promise<WaterTrackerResponse> {
    const uid = requireUid();
    if (auth.currentUser) await ensureUserAccountAndProfile(auth.currentUser);
    const activeDate = date || todayIsoDate();

    let dailyTargetMl = 2500;
    let remindersEnabled = false;
    try {
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (userSnap.exists()) {
        const d = userSnap.data();
        if (typeof d.dailyWaterTargetMl === 'number') dailyTargetMl = d.dailyWaterTargetMl;
        if (typeof d.hydrationNudges === 'boolean') remindersEnabled = d.hydrationNudges;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${uid}`);
    }

    const allLogs = await listOwnedDocs<WaterIntakeRecord>('water');
    const entries = allLogs
      .filter((w) => w.date === activeDate)
      .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));

    const totalIntakeMl = entries.reduce((sum, w) => sum + (Number(w.amountMl) || 0), 0);
    const days = getLast7Days(activeDate);
    const weeklyHistory = days.map(({ date: dIso, label }) => ({
      date: dIso,
      dayLabel: label,
      totalMl: allLogs
        .filter((w) => w.date === dIso)
        .reduce((sum, w) => sum + (Number(w.amountMl) || 0), 0),
    }));

    return {
      date: activeDate,
      dailyTargetMl,
      totalIntakeMl,
      remindersEnabled,
      entries,
      weeklyHistory,
    };
  },

  async logIntake(payload: { date: string; amountMl: number }): Promise<WaterIntakeRecord> {
    const uid = requireUid();
    if (auth.currentUser) await ensureUserAccountAndProfile(auth.currentUser);
    const path = `users/${uid}/water`;
    const body = {
      userId: uid,
      date: payload.date,
      amountMl: clampInt(payload.amountMl, BLUEPRINT_LIMITS.WATER_MIN_ML, BLUEPRINT_LIMITS.WATER_MAX_ML),
      loggedAt: new Date().toISOString(),
      createdAt: serverTimestamp(),
    };
    try {
      const ref = await addDoc(collection(db, 'users', uid, 'water'), body);
      return {
        id: ref.id,
        date: body.date,
        amountMl: body.amountMl,
        loggedAt: body.loggedAt,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  async updatePreferences(payload: {
    dailyTargetMl?: number;
    remindersEnabled?: boolean;
  }): Promise<WaterTrackerResponse> {
    const uid = requireUid();
    if (auth.currentUser) await ensureUserAccountAndProfile(auth.currentUser);
    const path = `users/${uid}`;
    const patch: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (payload.dailyTargetMl !== undefined) {
      patch.dailyWaterTargetMl = clampInt(
        payload.dailyTargetMl,
        BLUEPRINT_LIMITS.TARGET_MIN,
        BLUEPRINT_LIMITS.TARGET_MAX,
      );
    }
    if (payload.remindersEnabled !== undefined) {
      patch.hydrationNudges = Boolean(payload.remindersEnabled);
    }
    try {
      await updateDoc(doc(db, 'users', uid), patch);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
    return firebaseWaterService.getStatus();
  },
};

export const firebaseJournalService = {
  async list(searchQuery?: string): Promise<JournalEntry[]> {
    const rows = await listOwnedDocs<JournalEntry>('journal');
    const sorted = rows
      .map((r) => ({
        id: r.id,
        title: r.title,
        content: r.content,
        category: r.category,
        entryDate: r.entryDate,
      }))
      .sort((a, b) => b.entryDate.localeCompare(a.entryDate));
    if (!searchQuery?.trim()) return sorted;
    const q = searchQuery.trim().toLowerCase();
    return sorted.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q),
    );
  },

  async create(payload: Omit<JournalEntry, 'id'>): Promise<JournalEntry> {
    const uid = requireUid();
    if (auth.currentUser) await ensureUserAccountAndProfile(auth.currentUser);
    const path = `users/${uid}/journal`;
    const body = {
      userId: uid,
      title: sanitizeBoundedText(payload.title, BLUEPRINT_LIMITS.TITLE_MAX),
      content: sanitizeBoundedText(payload.content, BLUEPRINT_LIMITS.CONTENT_MAX),
      category: payload.category,
      entryDate: sanitizeBoundedText(payload.entryDate, BLUEPRINT_LIMITS.DATETIME_MAX),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    try {
      const ref = await addDoc(collection(db, 'users', uid, 'journal'), body);
      return {
        id: ref.id,
        title: body.title,
        content: body.content,
        category: body.category,
        entryDate: body.entryDate,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  async update(id: string, payload: Omit<JournalEntry, 'id'>): Promise<JournalEntry> {
    const uid = requireUid();
    const path = `users/${uid}/journal/${id}`;
    const clean = {
      title: sanitizeBoundedText(payload.title, BLUEPRINT_LIMITS.TITLE_MAX),
      content: sanitizeBoundedText(payload.content, BLUEPRINT_LIMITS.CONTENT_MAX),
      category: payload.category,
      entryDate: sanitizeBoundedText(payload.entryDate, BLUEPRINT_LIMITS.DATETIME_MAX),
      updatedAt: serverTimestamp(),
    };
    try {
      await updateDoc(doc(db, 'users', uid, 'journal', id), clean);
      return {
        id,
        title: clean.title,
        content: clean.content,
        category: clean.category,
        entryDate: clean.entryDate,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  async remove(id: string): Promise<void> {
    const uid = requireUid();
    const path = `users/${uid}/journal/${id}`;
    try {
      await deleteDoc(doc(db, 'users', uid, 'journal', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },
};

export const firebaseProfileService = {
  async get(): Promise<UserProfile> {
    const uid = requireUid();
    const fbUser = auth.currentUser!;
    await ensureUserAccountAndProfile(fbUser);

    let rootData: Record<string, unknown> = {};
    let privateData: Record<string, unknown> = {};
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) rootData = snap.data();
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${uid}`);
    }

    try {
      const snap = await getDoc(doc(db, 'users', uid, 'private', 'profile'));
      if (snap.exists()) privateData = snap.data();
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${uid}/private/profile`);
    }

    return {
      id: uid,
      fullName: (rootData.fullName as string) || fbUser.displayName || 'Member',
      email: (privateData.email as string) || fbUser.email || '',
      dateOfBirth: (privateData.dateOfBirth as string) || '',
      phoneNumber: (privateData.phoneNumber as string) || '',
      memberSince: (rootData.memberSince as string) || todayIsoDate(),
      accountTier: (rootData.accountTier as string) || 'Firebase Cloud',
      preferences: {
        cycleReminders: Boolean(rootData.cycleReminders ?? true),
        medicationAlerts: Boolean(rootData.medicationAlerts ?? true),
        hydrationNudges: Boolean(rootData.hydrationNudges ?? false),
        dailyCalorieTarget: (rootData.dailyCalorieTarget as number) || 2000,
        dailyWaterTargetMl: (rootData.dailyWaterTargetMl as number) || 2500,
      },
    };
  },

  async update(payload: Partial<UserProfile>): Promise<UserProfile> {
    const uid = requireUid();
    if (auth.currentUser) await ensureUserAccountAndProfile(auth.currentUser);

    const rootPatch: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (payload.fullName !== undefined) {
      rootPatch.fullName = sanitizeBoundedText(payload.fullName, BLUEPRINT_LIMITS.FULL_NAME_MAX);
    }
    if (payload.preferences) {
      rootPatch.cycleReminders = Boolean(payload.preferences.cycleReminders);
      rootPatch.medicationAlerts = Boolean(payload.preferences.medicationAlerts);
      rootPatch.hydrationNudges = Boolean(payload.preferences.hydrationNudges);
      if (payload.preferences.dailyCalorieTarget !== undefined) {
        rootPatch.dailyCalorieTarget = clampInt(
          payload.preferences.dailyCalorieTarget,
          BLUEPRINT_LIMITS.TARGET_MIN,
          BLUEPRINT_LIMITS.TARGET_MAX,
        );
      }
      if (payload.preferences.dailyWaterTargetMl !== undefined) {
        rootPatch.dailyWaterTargetMl = clampInt(
          payload.preferences.dailyWaterTargetMl,
          BLUEPRINT_LIMITS.TARGET_MIN,
          BLUEPRINT_LIMITS.TARGET_MAX,
        );
      }
    }

    try {
      await updateDoc(doc(db, 'users', uid), rootPatch);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }

    const privatePatch: Record<string, unknown> = { updatedAt: serverTimestamp() };
    let hasPrivateChanges = false;
    if (payload.email !== undefined) {
      privatePatch.email = sanitizeBoundedText(payload.email, BLUEPRINT_LIMITS.EMAIL_MAX);
      hasPrivateChanges = true;
    }
    if (payload.dateOfBirth !== undefined) {
      privatePatch.dateOfBirth = sanitizeBoundedText(payload.dateOfBirth, BLUEPRINT_LIMITS.DATE_LEN);
      hasPrivateChanges = true;
    }
    if (payload.phoneNumber !== undefined) {
      privatePatch.phoneNumber = sanitizeBoundedText(payload.phoneNumber, BLUEPRINT_LIMITS.PHONE_MAX);
      hasPrivateChanges = true;
    }

    if (hasPrivateChanges) {
      try {
        await updateDoc(doc(db, 'users', uid, 'private', 'profile'), privatePatch);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/private/profile`);
      }
    }

    return firebaseProfileService.get();
  },

  async deleteAccount(): Promise<void> {
    const uid = requireUid();
    const subcollections = ['periods', 'symptoms', 'wellness', 'nutrition', 'water', 'journal'];
    for (const sub of subcollections) {
      const docs = await listOwnedDocs<{ id: string }>(sub);
      for (const item of docs) {
        try {
          await deleteDoc(doc(db, 'users', uid, sub, item.id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `users/${uid}/${sub}/${item.id}`);
        }
      }
    }

    try {
      await deleteDoc(doc(db, 'users', uid, 'private', 'profile'));
    } catch {
      // ignore if already deleted
    }

    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}`);
    }

    const current = auth.currentUser;
    if (current) {
      try {
        await deleteUser(current);
      } catch {
        await signOut(auth);
      }
    }
  },
};

export const firebaseDashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const today = todayIsoDate();
    const [profile, periods, symptoms, wellness, nutrition, water, journal] = await Promise.all([
      firebaseProfileService.get(),
      firebasePeriodsService.list(),
      firebaseSymptomsService.list(),
      firebaseWellnessService.list(),
      firebaseNutritionService.getSummary(today),
      firebaseWaterService.getStatus(today),
      firebaseJournalService.list(),
    ]);

    const estimate = calculatePeriodEstimate(periods, today);
    const lengths = calculateCycleLengths(periods);
    const sortedPeriodsDesc = [...periods].sort((a, b) => b.startDate.localeCompare(a.startDate));
    const cycleHistory = sortedPeriodsDesc
      .slice(0, lengths.length)
      .map((p, idx) => ({
        month: p.startDate.slice(0, 7),
        lengthDays: lengths[lengths.length - 1 - idx] ?? estimate?.averageCycleLength ?? 28,
      }))
      .reverse();

    let daysUntilNextPeriod: number | null = null;
    if (estimate?.nextPeriodStart) {
      const nextMs = new Date(`${estimate.nextPeriodStart}T00:00:00Z`).getTime();
      const todayMs = new Date(`${today}T00:00:00Z`).getTime();
      daysUntilNextPeriod = Math.round((nextMs - todayMs) / (1000 * 60 * 60 * 24));
    }

    const latestWellness = wellness[0] ?? null;
    const latestSymptom = symptoms[0] ?? null;
    const macros = sumNutritionMacros(nutrition.meals);

    return {
      userName: profile.fullName,
      cycleSummary: {
        currentDay: estimate?.currentCycleDay ?? null,
        phase: estimate?.currentPhase ?? 'Uncharted',
        daysUntilNextPeriod,
        nextPeriodDate: estimate?.nextPeriodStart ?? null,
        fertilityStatus:
          estimate && today >= estimate.fertileWindowStart && today <= estimate.fertileWindowEnd
            ? 'Estimated fertile window'
            : estimate
              ? `Fertile window starts ${estimate.fertileWindowStart}`
              : null,
        averageCycleLength: estimate?.averageCycleLength ?? null,
        cycleHistory,
      },
      wellnessSummary: {
        mood: latestWellness?.mood ?? null,
        sleepHours: latestWellness?.sleepHours ?? null,
        energyLevel: latestSymptom ? `${latestSymptom.energyLevel}/5` : null,
        insight: latestWellness
          ? `Latest mood logged as ${latestWellness.mood} with ${latestWellness.sleepHours}h sleep.`
          : null,
      },
      waterSummary: {
        intakeMl: water.totalIntakeMl,
        targetMl: water.dailyTargetMl,
      },
      latestSymptom,
      nutritionSummary: {
        caloriesConsumed: Math.round(macros.calories),
        caloriesTarget: nutrition.targets.calories,
        antiInflammatoryScore: null,
        sugarStatus: nutrition.meals.length > 0 ? `${nutrition.meals.length} meals logged` : null,
      },
      recentJournalEntries: journal.slice(0, 3),
    };
  },
};
