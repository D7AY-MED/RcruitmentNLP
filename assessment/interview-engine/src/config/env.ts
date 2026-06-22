import dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? "3010"),
  nodeEnv: process.env.NODE_ENV ?? "development",
  openaiApiKey: required("OPENAI_API_KEY"),
  openaiFastModel: process.env.OPENAI_FAST_MODEL ?? "gpt-4.1-mini",
  openaiReportModel: process.env.OPENAI_REPORT_MODEL ?? "gpt-4.1",
  supabaseUrl: required("SUPABASE_URL"),
  supabaseServiceKey: required("SUPABASE_SERVICE_KEY"),
  tablePrefix: process.env.INTERVIEW_TABLE_PREFIX ?? "tst_",
};
