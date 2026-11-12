import { createAdminClient } from "@/lib/supabase/admin";
import { AuditLog } from "@/types";

export interface LogAuditEventParams {
  actor_id?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  previous_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
}

export async function logAuditEvent(params: LogAuditEventParams): Promise<void> {
  const supabase = createAdminClient();

  try {
    await supabase.from("audit_logs").insert({
      actor_id: params.actor_id || null,
      action: params.action,
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      previous_data: params.previous_data || null,
      new_data: params.new_data || null,
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}

export async function getAuditLogs(options?: {
  entityType?: string;
  entityId?: string;
  actorId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ logs: AuditLog[]; totalCount: number }> {
  const supabase = createAdminClient();
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  let query = supabase
    .from("audit_logs")
    .select(`
      *,
      actor:profiles!audit_logs_actor_id_fkey(full_name, role)
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (options?.entityType) {
    query = query.eq("entity_type", options.entityType);
  }
  if (options?.entityId) {
    query = query.eq("entity_id", options.entityId);
  }
  if (options?.actorId) {
    query = query.eq("actor_id", options.actorId);
  }

  const { data, count, error } = await query;

  if (error) {
    // Fallback if foreign key join is not explicit
    const { data: rawData, count: rawCount } = await supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const formatted = (rawData || []).map((item: any) => ({
      ...item,
      actor_name: "Staff",
      actor_role: null,
    }));

    return { logs: formatted as AuditLog[], totalCount: rawCount || 0 };
  }

  const formatted: AuditLog[] = (data || []).map((item: any) => {
    const actor = item.actor as { full_name?: string; role?: string } | null;
    return {
      ...item,
      actor_name: actor?.full_name || "System",
      actor_role: (actor?.role as AuditLog["actor_role"]) || null,
    };
  });

  return { logs: formatted, totalCount: count || 0 };
}
