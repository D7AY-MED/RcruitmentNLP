import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";

const app = buildApp();
app.listen(env.port, () => {
  logger.info({ port: env.port }, "Interview engine started");
});
