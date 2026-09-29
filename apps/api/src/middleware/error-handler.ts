import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  const details =
    typeof error === "object" && error !== null
      ? (error as {
          type?: unknown;
          status?: unknown;
        })
      : {};

  if (details.type === "entity.parse.failed") {
    return response.status(400).json({
      error: "Invalid JSON payload",
    });
  }

  const status =
    typeof details.status === "number" &&
    details.status >= 400 &&
    details.status < 600
      ? details.status
      : 500;

  if (status >= 500) {
    console.error("Unhandled API error:", {
      requestId: response.locals.requestId,
      error,
    });
  }

  return response.status(status).json({
    error: status >= 500 ? "Internal server error" : "Request failed",
  });
};
