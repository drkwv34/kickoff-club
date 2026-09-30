export const RSVP_STATUSES = [
  "going",
  "waitlisted",
  "declined",
  "cancelled",
] as const;

export type RsvpStatus = (typeof RSVP_STATUSES)[number];

export type RsvpRecord = {
  id: string;
  matchId: string;
  userId: string;
  status: RsvpStatus;
  waitlistPosition: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicRsvp = {
  id: string;
  matchId: string;
  userId: string;
  status: RsvpStatus;
  waitlistPosition: number | null;
  createdAt: string;
  updatedAt: string;
};

export function toPublicRsvp(rsvp: RsvpRecord): PublicRsvp {
  return {
    id: rsvp.id,
    matchId: rsvp.matchId,
    userId: rsvp.userId,
    status: rsvp.status,
    waitlistPosition: rsvp.waitlistPosition,
    createdAt: rsvp.createdAt.toISOString(),
    updatedAt: rsvp.updatedAt.toISOString(),
  };
}
