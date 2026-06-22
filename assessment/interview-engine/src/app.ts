import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createInterviewRouter } from "./routes/interviewRoutes.js";
import { ReportRepository } from "./repositories/reportRepository.js";
import { SessionRepository } from "./repositories/sessionRepository.js";
import { TemplateRepository } from "./repositories/templateRepository.js";
import { TurnRepository } from "./repositories/turnRepository.js";
import { InterviewEngine } from "./services/interviewEngine.js";
import { NextQuestionGenerator } from "./services/nextQuestionGenerator.js";
import { OpenAIClient } from "./services/openaiClient.js";
import { ReportGenerator } from "./services/reportGenerator.js";
import { StateManager } from "./services/stateManager.js";

export function buildApp() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const publicDir = path.resolve(__dirname, "../public");

  const templateRepo = new TemplateRepository();
  const sessionRepo = new SessionRepository();
  const turnRepo = new TurnRepository();
  const reportRepo = new ReportRepository();
  const stateManager = new StateManager();
  const openaiClient = new OpenAIClient();
  const nextQuestionGenerator = new NextQuestionGenerator(openaiClient, stateManager);
  const reportGenerator = new ReportGenerator(openaiClient, turnRepo);
  const interviewEngine = new InterviewEngine(
    templateRepo,
    sessionRepo,
    turnRepo,
    reportRepo,
    stateManager,
    nextQuestionGenerator,
    reportGenerator,
  );

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "interview-engine" });
  });
  app.use("/api/interview", createInterviewRouter(interviewEngine));
  app.use(express.static(publicDir));
  app.get("/", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
  return app;
}
