import { Worker, Job } from "bullmq";
import { getIoRedis } from "../lib/redis";
import { BookingJobData, VENDOR_MATCHING_QUEUE } from "../lib/queue";

const connection = getIoRedis()!;

const worker = new Worker(
  VENDOR_MATCHING_QUEUE,
  async (job: Job<BookingJobData>) => {
    const { bookingId, iteration, radius } = job.data;
    console.log(`Processing matching for booking ${bookingId}, iteration ${iteration}, radius ${radius}`);
    // ... logic ...
  },
  {
    connection: connection as any,
    concurrency: 5, // Process multiple matchings in parallel
    limiter: {
      max: 50,
      duration: 1000,
    }
  }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed!`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed with error: ${err.message}`);
});

export default worker;
