import app from "./app.js";
import { prisma } from "./db/prisma.js";

const PORT = Number(process.env.PORT) || 3000;

const server = app.listen(PORT, () => {
  console.log(`MARNYX API running on http://localhost:${PORT}`);
});

const shutdown = async (signal: string) => {
  console.log(`\n${signal} received. Shutting down MARNYX API...`);

  server.close(async (error) => {
    if (error) {
      console.error("Error while shutting down HTTP server:", error);
      process.exitCode = 1;
      return;
    }

    try {
      await prisma.$disconnect();
      console.log("Prisma disconnected.");
      console.log("MARNYX API stopped cleanly.");
    } catch (disconnectError) {
      console.error("Error while disconnecting Prisma:", disconnectError);
      process.exitCode = 1;
    }
  });
};

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
