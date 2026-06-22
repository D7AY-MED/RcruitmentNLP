import { supabase } from "../lib/supabase.js";
import { tables } from "../lib/tables.js";
import { FinalReport } from "../types/interview.js";
import { prefixedId } from "../utils/id.js";

interface ReportRow {
  id: string;
  session_id: string;
  report_json: FinalReport;
  recommendation: string;
}

export class ReportRepository {
  async create(sessionId: string, report: FinalReport): Promise<string> {
    const id = prefixedId("rep");
    const { error } = await supabase.from(tables.reports).insert({
      id,
      session_id: sessionId,
      report_json: report,
      recommendation: report.recommendation,
    });
    if (error) throw new Error(`Failed to create report: ${error.message}`);
    return id;
  }

  async getBySessionId(sessionId: string): Promise<ReportRow | null> {
    const { data, error } = await supabase
      .from(tables.reports)
      .select("id, session_id, report_json, recommendation")
      .eq("session_id", sessionId)
      .maybeSingle<ReportRow>();
    if (error) throw new Error(`Failed to fetch report: ${error.message}`);
    return data ?? null;
  }
}
