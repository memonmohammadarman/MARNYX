import express from "express";
import healthRouter from "./routes/health.routes.js";
import databaseRouter from "./routes/database.routes.js";
import { securityHeaders } from "./middleware/security-headers.js";
import authRouter from "./modules/auth/routes/auth.routes.js";
import { errorHandler } from "./middleware/error-handler.js";

const app = express();

app.disable("x-powered-by");

app.use(securityHeaders);

app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({
    name: "MARNYX API",
    status: "running",
    version: "0.1.0",
  });
});

app.use("/api", healthRouter);
app.use("/api", databaseRouter);
app.use("/api/auth", authRouter);

app.use((_request, response) => {
  response.status(404).json({
    error: "Route not found",
  });
});

app.use(errorHandler);

export default app;
