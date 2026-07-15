import { Inngest } from "inngest";
import logger from "./logger";

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "mana-events-app",
  middleware: [
    class LoggerMiddleware {
      onFunctionRun({ fn }: { fn: any }) {
        const start = Date.now();
        return {
          afterExecution() {
            const duration = Date.now() - start;
            logger.info(`[Inngest] Function ${fn.id} completed`, {
              functionId: fn.id,
              duration,
            });
          },
        };
      }
    } as any,
  ],
});
