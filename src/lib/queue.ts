import { Queue } from "bullmq";
import { getIoRedis } from "./redis";

const connection = getIoRedis()!;

export const VENDOR_MATCHING_QUEUE = "vendor-matching";

export const vendorMatchingQueue = new Queue(VENDOR_MATCHING_QUEUE, {
  connection: connection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
  },
});

export interface BookingJobData {
  bookingId: string;
  iteration: number;
  radius: number;
}

export async function addBookingToQueue(data: BookingJobData) {
  await vendorMatchingQueue.add(`match-${data.bookingId}-${data.iteration}`, data, {
    delay: data.iteration === 0 ? 0 : 30000, // 30s delay between matching rounds
  });
}
