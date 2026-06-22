import { readFile } from "node:fs/promises";
import path from "node:path";

const PROMPT_PATH = path.resolve(process.cwd(), "docum/interview.txt");

export async function buildInterviewPrompt(cvContent: string): Promise<string> {
  const template = await readFile(PROMPT_PATH, "utf8");
  return template.replace("{{CV_CONTENT}}", cvContent.trim());
}
