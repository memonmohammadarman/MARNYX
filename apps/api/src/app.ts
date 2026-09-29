import express from "express";
import healthRouter from "./routes/health.routes.js";
import databaseRouter from "./routes/database.routes.js";
import authRouter from "./modules/auth/routes/auth.routes.js";

const app = express();

app.disable("x-powered-by");

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

export default app;
