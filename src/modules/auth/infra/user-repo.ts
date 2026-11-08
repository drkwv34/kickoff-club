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
    async update(id, patch) {
      const values: Partial<typeof users.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (patch.displayName !== undefined) {
        values.displayName = patch.displayName;
      }
      if (patch.timezone !== undefined) {
        values.timezone = patch.timezone;
      }
      const [row] = await db
        .update(users)
        .set(values)
        .where(eq(users.id, id))
        .returning();
      if (!row) {
        throw new Error("update users returned no row");
      }
      return toUserRecord(row);
    },
    async updatePassword(id, passwordHash) {
      const [row] = await db
        .update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      if (!row) {
        throw new Error("update users password returned no row");
      }
      return toUserRecord(row);
    },
  };
}
