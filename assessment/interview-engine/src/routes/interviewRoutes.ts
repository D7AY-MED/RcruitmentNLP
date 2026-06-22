import { Router } from "express";
import {
  StartInterviewRequestSchema,
  SubmitAnswerRequestSchema,
} from "../schemas/interview.js";
import { InterviewEngine } from "../services/interviewEngine.js";

export function createInterviewRouter(engine: InterviewEngine): Router {
  const router = Router();

  router.post("/start", async (req, res) => {
    try {
      const input = StartInterviewRequestSchema.parse(req.body);
      const result = await engine.start(input.candidateId, input.templateId);
      return res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return res.status(400).json({ error: message });
    }
  });

  router.post("/answer", async (req, res) => {
    try {
      const input = SubmitAnswerRequestSchema.parse(req.body);
      const result = await engine.answer(input);
      return res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return res.status(400).json({ error: message });
    }
  });

  router.get("/session/:sessionId", async (req, res) => {
    try {
      const result = await engine.resume(req.params.sessionId);
      return res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return res.status(404).json({ error: message });
    }
  });

  router.get("/report/:sessionId", async (req, res) => {
    try {
      const report = await engine.getFinalReport(req.params.sessionId);
      if (!report) return res.status(404).json({ error: "Final report not found" });
      return res.json({ report });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return res.status(500).json({ error: message });
    }
  });

  return router;
}
