import { Router } from "express";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "marnyx-api",
    version: "0.1.0"
  });
});

export default router;
