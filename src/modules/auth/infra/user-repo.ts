import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { mapUnknownError } from "@/lib/errors/domain-error";
import type { UserRepository } from "../domain/ports";
import type { UserRecord } from "../domain/user";

type Db = ReturnType<typeof getDb>;

function toUserRecord(row: typeof users.$inferSelect): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    displayName: row.displayName,
    timezone: row.timezone,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createUserRepository(db: Db): UserRepository {
  return {
    async findByEmail(email) {
      const [row] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      return row ? toUserRecord(row) : null;
    },
    async findById(id) {
      const [row] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      return row ? toUserRecord(row) : null;
    },
    async create(input) {
      try {
        const [row] = await db
          .insert(users)
          .values({
            email: input.email,
            passwordHash: input.passwordHash,
            displayName: input.displayName,
            timezone: input.timezone,
          })
          .returning();
        if (!row) {
          throw new Error("insert users returned no row");
        }
        return toUserRecord(row);
      } catch (err) {
        throw mapUnknownError(err);
      }
    },
  };
}
