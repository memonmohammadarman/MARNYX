import express from "express";
import healthRouter from "./routes/health.routes.js";

const app = express();

app.disable("x-powered-by");

app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({
    name: "MARNYX API",
    status: "running",
    version: "0.1.0"
  });
});

app.use("/api", healthRouter);

export default app;
