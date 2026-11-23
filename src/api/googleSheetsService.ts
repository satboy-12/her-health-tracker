import type {
  JournalEntry,
  NutritionMealItem,
  PcosSymptomLog,
  PeriodRecord,
  WaterIntakeRecord,
  WellnessEntry,
} from '../types/api';

export interface DriveSpreadsheetFile {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface SheetTabMeta {
  sheetId: number;
  title: string;
  rowCount?: number;
  columnCount?: number;
}

export interface SpreadsheetMetadata {
  spreadsheetId: string;
  title: string;
  spreadsheetUrl: string;
  sheets: SheetTabMeta[];
}

export interface HealthSyncPayload {
  periods: PeriodRecord[];
  symptoms: PcosSymptomLog[];
  wellness: WellnessEntry[];
  meals: NutritionMealItem[];
  waterEntries: WaterIntakeRecord[];
  journal: JournalEntry[];
}

export class WorkspaceApiError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'WorkspaceApiError';
    this.status = status;
  }
}

async function googleFetch<T>(url: string, accessToken: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  if (!res.ok) {
    let message = `Google API request failed (${res.status})`;
    try {
      const errBody = (await res.json()) as { error?: { message?: string } };
      if (errBody?.error?.message) {
        message = errBody.error.message;
      }
    } catch {
      // keep default message
    }
    throw new WorkspaceApiError(message, res.status);
  }

  return (await res.json()) as T;
}

export async function listUserSpreadsheets(accessToken: string): Promise<DriveSpreadsheetFile[]> {
  const q = encodeURIComponent(
    "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
  );
  const fields = encodeURIComponent('files(id,name,modifiedTime,webViewLink)');
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&orderBy=modifiedTime%20desc&pageSize=25`;
  const data = await googleFetch<{ files?: DriveSpreadsheetFile[] }>(url, accessToken);
  return data.files || [];
}

export async function getSpreadsheetMeta(
  accessToken: string,
  spreadsheetId: string,
): Promise<SpreadsheetMetadata> {
  const fields = encodeURIComponent(
    'spreadsheetId,properties.title,spreadsheetUrl,sheets.properties(sheetId,title,gridProperties)',
  );
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId,
  )}?fields=${fields}`;
  const data = await googleFetch<{
    spreadsheetId: string;
    properties?: { title?: string };
    spreadsheetUrl?: string;
    sheets?: Array<{
      properties?: {
        sheetId?: number;
        title?: string;
        gridProperties?: { rowCount?: number; columnCount?: number };
      };
    }>;
  }>(url, accessToken);

  return {
    spreadsheetId: data.spreadsheetId,
    title: data.properties?.title || 'Untitled Spreadsheet',
    spreadsheetUrl:
      data.spreadsheetUrl ||
      `https://docs.google.com/spreadsheets/d/${encodeURIComponent(data.spreadsheetId)}`,
    sheets: (data.sheets || []).map((s, idx) => ({
      sheetId: s.properties?.sheetId ?? idx,
      title: s.properties?.title || `Sheet${idx + 1}`,
      rowCount: s.properties?.gridProperties?.rowCount,
      columnCount: s.properties?.gridProperties?.columnCount,
    })),
  };
}

export async function readSheetValues(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string,
  range = 'A1:K50',
): Promise<string[][]> {
  const fullRange = `${sheetTitle}!${range}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId,
  )}/values/${encodeURIComponent(fullRange)}`;
  const data = await googleFetch<{ values?: string[][] }>(url, accessToken);
  return data.values || [];
}

const SYNC_TAB_NAMES = [
  'Periods',
  'PCOS_Symptoms',
  'Mood_Sleep',
  'Nutrition',
  'Water',
  'Journal',
] as const;

export function buildHealthSheetValueRanges(data: HealthSyncPayload): Array<{
  range: string;
  values: Array<Array<string | number>>;
}> {
  return [
    {
      range: 'Periods!A1',
      values: [
        ['ID', 'Start Date', 'End Date', 'Flow Intensity', 'Symptoms', 'Notes'],
        ...data.periods.map((p) => [
          p.id,
          p.startDate,
          p.endDate,
          p.flowIntensity,
          (p.symptoms || []).join(', '),
          p.notes || '',
        ]),
      ],
    },
    {
      range: 'PCOS_Symptoms!A1',
      values: [
        ['ID', 'Date', 'Symptoms', 'Severity (1-5)', 'Pain Level (0-10)', 'Energy (1-5)', 'Observations'],
        ...data.symptoms.map((s) => [
          s.id,
          s.date,
          (s.symptoms || []).join(', '),
          s.severity,
          s.painLevel,
          s.energyLevel,
          s.observations || '',
        ]),
      ],
    },
    {
      range: 'Mood_Sleep!A1',
      values: [
        ['ID', 'Date', 'Mood', 'Sleep Hours', 'Sleep Quality', 'Stress Level (1-10)', 'Notes'],
        ...data.wellness.map((w) => [
          w.id,
          w.date,
          w.mood,
          w.sleepHours,
          w.sleepQuality,
          w.stressLevel,
          w.notes || '',
        ]),
      ],
    },
    {
      range: 'Nutrition!A1',
      values: [
        [
          'ID',
          'Date',
          'Meal Type',
          'Food Name',
          'Portion',
          'Calories (kcal)',
          'Protein (g)',
          'Carbs (g)',
          'Fat (g)',
          'Fiber (g)',
        ],
        ...data.meals.map((m) => [
          m.id,
          m.date,
          m.mealType,
          m.foodName,
          m.portion,
          m.calories,
          m.proteinGrams,
          m.carbsGrams,
          m.fatGrams,
          m.fiberGrams,
        ]),
      ],
    },
    {
      range: 'Water!A1',
      values: [
        ['ID', 'Date', 'Amount (ml)', 'Logged Timestamp'],
        ...data.waterEntries.map((w) => [w.id, w.date, w.amountMl, w.loggedAt]),
      ],
    },
    {
      range: 'Journal!A1',
      values: [
        ['ID', 'Entry Date', 'Category', 'Title', 'Content'],
        ...data.journal.map((j) => [j.id, j.entryDate, j.category, j.title, j.content]),
      ],
    },
  ];
}

export async function createHealthWorkbook(
  accessToken: string,
  title = 'Her Health Journey — Wellness Log',
): Promise<SpreadsheetMetadata> {
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';
  const created = await googleFetch<{
    spreadsheetId: string;
    properties?: { title?: string };
    spreadsheetUrl?: string;
    sheets?: Array<{ properties?: { sheetId?: number; title?: string } }>;
  }>(url, accessToken, {
    method: 'POST',
    body: JSON.stringify({
      properties: { title },
      sheets: SYNC_TAB_NAMES.map((tabTitle) => ({
        properties: { title: tabTitle },
      })),
    }),
  });

  return {
    spreadsheetId: created.spreadsheetId,
    title: created.properties?.title || title,
    spreadsheetUrl:
      created.spreadsheetUrl ||
      `https://docs.google.com/spreadsheets/d/${encodeURIComponent(created.spreadsheetId)}`,
    sheets: (created.sheets || []).map((s, idx) => ({
      sheetId: s.properties?.sheetId ?? idx,
      title: s.properties?.title || SYNC_TAB_NAMES[idx],
    })),
  };
}

export async function syncHealthDataToSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  data: HealthSyncPayload,
): Promise<{ updatedCells: number; updatedSheets: number }> {
  const meta = await getSpreadsheetMeta(accessToken, spreadsheetId);
  const existingTitles = new Set(meta.sheets.map((s) => s.title));
  const missingTabs = SYNC_TAB_NAMES.filter((name) => !existingTitles.has(name));

  if (missingTabs.length > 0) {
    await googleFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
        spreadsheetId,
      )}:batchUpdate`,
      accessToken,
      {
        method: 'POST',
        body: JSON.stringify({
          requests: missingTabs.map((tabTitle) => ({
            addSheet: { properties: { title: tabTitle } },
          })),
        }),
      },
    );
  }

  // Clear existing synced ranges first so old deleted rows don't linger
  await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId,
    )}/values:batchClear`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        ranges: SYNC_TAB_NAMES.map((name) => `${name}!A1:K1000`),
      }),
    },
  );

  const valueRanges = buildHealthSheetValueRanges(data);
  const result = await googleFetch<{
    totalUpdatedCells?: number;
    totalUpdatedSheets?: number;
  }>(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId,
    )}/values:batchUpdate`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: valueRanges,
      }),
    },
  );

  return {
    updatedCells: result.totalUpdatedCells ?? 0,
    updatedSheets: result.totalUpdatedSheets ?? valueRanges.length,
  };
}
