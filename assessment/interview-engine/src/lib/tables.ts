import { env } from "../config/env.js";

const p = env.tablePrefix;

export const tables = {
  templates: `${p}interview_templates`,
  sessions: `${p}interview_sessions`,
  turns: `${p}interview_turns`,
  reports: `${p}final_reports`,
  telemetry: `${p}interview_telemetry`,
};
