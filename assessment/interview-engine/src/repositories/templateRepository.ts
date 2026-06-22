import { supabase } from "../lib/supabase.js";
import { tables } from "../lib/tables.js";
import { InterviewTemplate, TemplateConfig } from "../types/interview.js";

interface TemplateRow {
  id: string;
  role: string;
  config_json: TemplateConfig;
  active: boolean;
}

export class TemplateRepository {
  async getById(templateId: string): Promise<InterviewTemplate> {
    const { data, error } = await supabase
      .from(tables.templates)
      .select("id, role, config_json, active")
      .eq("id", templateId)
      .eq("active", true)
      .single<TemplateRow>();

    if (error || !data) {
      throw new Error(`Template not found: ${templateId}`);
    }

    return {
      id: data.id,
      role: data.role,
      config: data.config_json,
    };
  }
}
