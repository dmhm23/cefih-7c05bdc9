import { supabase } from "@/integrations/supabase/client";

export interface UserActivitySummary {
  user_id: string;
  user_email: string;
  user_name: string | null;
  total_actions: number;
  last_activity: string;
}

export interface ActivityLogEntry {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  action: string;
  module: string | null;
  description: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  route: string | null;
  created_at: string;
}

export async function fetchUserActivitySummaries(): Promise<UserActivitySummary[]> {
  // We use a raw RPC-less approach: fetch all logs grouped client-side
  // For performance, we limit to last 10000 entries and aggregate in JS
  const { data, error } = await supabase
    .from("user_activity_logs")
    .select("user_id, user_email, user_name, created_at")
    .order("created_at", { ascending: false })
    .limit(10000);

  if (error || !data) return [];

  const map = new Map<string, UserActivitySummary>();
  for (const row of data) {
    const existing = map.get(row.user_id);
    if (existing) {
      existing.total_actions++;
    } else {
      map.set(row.user_id, {
        user_id: row.user_id,
        user_email: row.user_email,
        user_name: row.user_name,
        total_actions: 1,
        last_activity: row.created_at,
      });
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime(),
  );
}

export async function fetchUserActivityLogs(
  userId: string,
  filters?: { module?: string; action?: string; from?: string; to?: string },
): Promise<ActivityLogEntry[]> {
  let query = supabase
    .from("user_activity_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (filters?.module) query = query.eq("module", filters.module);
  if (filters?.action) query = query.eq("action", filters.action);
  if (filters?.from) query = query.gte("created_at", filters.from);
  if (filters?.to) query = query.lte("created_at", filters.to);

  const { data, error } = await query;
  if (error || !data) return [];
  return data as ActivityLogEntry[];
}
