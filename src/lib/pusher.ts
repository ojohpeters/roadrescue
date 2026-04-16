// Pusher removed — app uses polling instead.
// These stubs let existing imports compile without changes.

export const pusherServer = {
  trigger: async (_channel: string, _event: string, _data: unknown) => {
    // no-op: real-time via polling
  },
};

export function getPusherClient() {
  return null;
}

export const CHANNELS = {
  REQUESTS: "requests",
  REQUEST: (id: string) => `request-${id}`,
  MECHANIC: (id: string) => `mechanic-${id}`,
  ADMIN: "admin",
};

export const EVENTS = {
  NEW_REQUEST: "new-request",
  REQUEST_UPDATED: "request-updated",
  REQUEST_ACCEPTED: "request-accepted",
  REQUEST_COMPLETED: "request-completed",
  REQUEST_CANCELLED: "request-cancelled",
};
