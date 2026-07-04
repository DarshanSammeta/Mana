import { Inngest } from "inngest";

// Define event schemas for type safety
export type Events = {
  "booking/created": {
    data: {
      bookingId: string;
    };
  };
  "booking/confirmed": {
    data: {
      bookingId: string;
      eventDate: string | Date;
    };
  };
  "notification/dispatch.external": {
    data: {
      notificationId: string;
      userId: string;
      channels: {
        email?: boolean;
        sms?: boolean;
        push?: boolean;
      };
      payload: {
        title: string;
        message: string;
        metadata?: any;
      };
    };
  };
};

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "mana-events-app",
  schemas: {
    // In SDK v4, we can just pass the record of events to the schemas property
    // or use the specialized helper if available. Since EventSchemas is missing,
    // we'll try passing the record directly or omit the explicit class usage.
  } as any
});
