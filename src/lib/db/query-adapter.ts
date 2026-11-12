import { memoryStore } from "./mock-store";

export function isRealSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  if (url.includes("dummy-project") || key.includes("dummy-")) return false;
  return url.startsWith("https://") && key.length > 20;
}

type TableName =
  | "profiles"
  | "facility_settings"
  | "patients"
  | "temperature_readings"
  | "doctor_visits"
  | "audit_logs";

export class MockQueryBuilder {
  private tableName: TableName;
  private filters: Array<(row: Record<string, unknown>) => boolean> = [];
  private orderCol: string | null = null;
  private ascending = true;
  private limitNum: number | null = null;
  private rangeFrom = 0;
  private rangeTo: number | null = null;
  private isCountQuery = false;

  constructor(tableName: TableName) {
    this.tableName = tableName;
  }

  select(columns = "*", options?: { count?: "exact"; head?: boolean }) {
    if (options?.count === "exact") {
      this.isCountQuery = true;
    }
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push((row) => String(row[column]) === String(value));
    return this;
  }

  neq(column: string, value: unknown) {
    this.filters.push((row) => String(row[column]) !== String(value));
    return this;
  }

  in(column: string, values: unknown[]) {
    const set = new Set(values.map(String));
    this.filters.push((row) => set.has(String(row[column])));
    return this;
  }

  or(condition: string) {
    // Basic ilike or search support, e.g. "full_name.ilike.%query%,patient_code.ilike.%query%"
    const parts = condition.split(",");
    this.filters.push((row) => {
      return parts.some((p) => {
        const [col, op, val] = p.split(".");
        if (op === "ilike" && val) {
          const needle = val.replace(/%/g, "").toLowerCase();
          const target = String(row[col] || "").toLowerCase();
          return target.includes(needle);
        }
        return false;
      });
    });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderCol = column;
    this.ascending = options?.ascending !== false;
    return this;
  }

  limit(num: number) {
    this.limitNum = num;
    return this;
  }

  range(from: number, to: number) {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }

  private getTableRows(): Record<string, unknown>[] {
    switch (this.tableName) {
      case "facility_settings":
        return [memoryStore.getSettings() as unknown as Record<string, unknown>];
      case "profiles":
        return memoryStore.getProfiles() as unknown as Record<string, unknown>[];
      case "patients":
        return memoryStore.getPatients() as unknown as Record<string, unknown>[];
      case "temperature_readings":
        return memoryStore.getTemperatureReadings() as unknown as Record<string, unknown>[];
      case "doctor_visits":
        return memoryStore.getDoctorVisits() as unknown as Record<string, unknown>[];
      case "audit_logs":
        return memoryStore.getAuditLogs() as unknown as Record<string, unknown>[];
      default:
        return [];
    }
  }

  private execute() {
    let rows = this.getTableRows();

    // Apply filters
    for (const filter of this.filters) {
      rows = rows.filter(filter);
    }

    const totalCount = rows.length;

    // Apply sorting
    if (this.orderCol) {
      const col = this.orderCol;
      const asc = this.ascending;
      rows = [...rows].sort((a, b) => {
        const valA = a[col];
        const valB = b[col];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return asc ? -1 : 1;
        if (valB === null || valB === undefined) return asc ? 1 : -1;
        if (typeof valA === "number" && typeof valB === "number") {
          return asc ? valA - valB : valB - valA;
        }
        return asc
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    // Apply range / limit
    if (this.rangeTo !== null) {
      rows = rows.slice(this.rangeFrom, this.rangeTo + 1);
    } else if (this.limitNum !== null) {
      rows = rows.slice(0, this.limitNum);
    }

    return { data: rows, count: totalCount, error: null };
  }

  // Promise-like resolution
  then(resolve: (value: { data: unknown; count?: number; error: null }) => void) {
    resolve(this.execute());
  }

  async single() {
    const { data } = this.execute();
    return { data: (data as unknown[])[0] || null, error: null };
  }

  async maybeSingle() {
    const { data } = this.execute();
    return { data: (data as unknown[])[0] || null, error: null };
  }

  // Insert
  insert(values: Record<string, unknown> | Record<string, unknown>[]) {
    const records = Array.isArray(values) ? values : [values];
    const inserted: Record<string, unknown>[] = [];

    for (const val of records) {
      const id = (val.id as string) || crypto.randomUUID();
      const record = {
        ...val,
        id,
        created_at: val.created_at || new Date().toISOString(),
        updated_at: val.updated_at || new Date().toISOString(),
      };

      if (this.tableName === "patients") {
        memoryStore.addPatient(record as any);
      } else if (this.tableName === "temperature_readings") {
        memoryStore.addTemperatureReading(record as any);
      } else if (this.tableName === "doctor_visits") {
        memoryStore.addDoctorVisit(record as any);
      } else if (this.tableName === "audit_logs") {
        memoryStore.addAuditLog(record as any);
      } else if (this.tableName === "profiles") {
        memoryStore.addProfile(record as any);
      }

      inserted.push(record);
    }

    return {
      select: () => ({
        single: async () => ({ data: inserted[0], error: null }),
        maybeSingle: async () => ({ data: inserted[0], error: null }),
        then: (resolve: any) => resolve({ data: inserted, error: null }),
      }),
      then: (resolve: any) => resolve({ data: inserted, error: null }),
    };
  }

  // Upsert
  upsert(values: Record<string, unknown>) {
    return this.insert(values);
  }

  // Update
  update(values: Record<string, unknown>) {
    return {
      eq: (col: string, val: unknown) => {
        let updatedRecord: Record<string, unknown> | null = null;
        const idStr = String(val);

        if (this.tableName === "facility_settings") {
          updatedRecord = memoryStore.updateSettings(values as any) as any;
        } else if (this.tableName === "patients") {
          updatedRecord = memoryStore.updatePatient(idStr, values as any) as any;
        } else if (this.tableName === "temperature_readings") {
          updatedRecord = memoryStore.updateTemperatureReading(idStr, values as any) as any;
        } else if (this.tableName === "profiles") {
          updatedRecord = memoryStore.updateProfile(idStr, values as any) as any;
        }

        return {
          select: () => ({
            single: async () => ({ data: updatedRecord, error: null }),
            then: (resolve: any) => resolve({ data: updatedRecord ? [updatedRecord] : [], error: null }),
          }),
          then: (resolve: any) => resolve({ data: updatedRecord ? [updatedRecord] : [], error: null }),
        };
      },
    };
  }
}

export function createMockClient() {
  return {
    from: (tableName: TableName) => new MockQueryBuilder(tableName),
    auth: {
      admin: {
        createUser: async (params: any) => {
          const id = crypto.randomUUID();
          const user = {
            id,
            email: params.email,
            user_metadata: params.user_metadata,
          };
          return { data: { user }, error: null };
        },
      },
    },
  };
}

