import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { passwordResetTokens } from "@/lib/db/schema";
import type { PasswordResetTokenRepository } from "../domain/ports";
import type { PasswordResetTokenRecord } from "../domain/password-reset";

type Db = ReturnType<typeof getDb>;

function toRecord(
  row: typeof passwordResetTokens.$inferSelect,
): PasswordResetTokenRecord {
  return {
    id: row.id,
    userId: row.userId,
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt,
    usedAt: row.usedAt ?? null,
    createdAt: row.createdAt,
  };
}

export function createPasswordResetTokenRepository(
  db: Db,
): PasswordResetTokenRepository {
  return {
    async create(input) {
      const [row] = await db
        .insert(passwordResetTokens)
        .values({
          userId: input.userId,
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
          createdAt: input.createdAt,
        })
        .returning();
      if (!row) {
        throw new Error("insert password_reset_tokens returned no row");
      }
      return toRecord(row);
    },
    async findByTokenHash(tokenHash) {
      const [row] = await db
        .select()
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.tokenHash, tokenHash))
        .limit(1);
      return row ? toRecord(row) : null;
    },
    async markUsed(id, usedAt) {
      await db
        .update(passwordResetTokens)
        .set({ usedAt })
        .where(
          and(eq(passwordResetTokens.id, id), isNull(passwordResetTokens.usedAt)),
        );
    },
    async invalidateUnusedForUser(userId, usedAt) {
      await db
        .update(passwordResetTokens)
        .set({ usedAt })
        .where(
          and(
            eq(passwordResetTokens.userId, userId),
            isNull(passwordResetTokens.usedAt),
          ),
        );
    },
  };
}
