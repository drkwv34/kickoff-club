export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicUser = {
  id: string;
  email: string;
  displayName: string;
  timezone: string;
};

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    timezone: user.timezone,
  };
}
