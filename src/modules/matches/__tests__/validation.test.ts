import { describe, expect, it } from "vitest";
import { updateMatchBodySchema } from "../validation";

describe("updateMatchBodySchema", () => {
  it("keeps omitted description undefined and clears empty or null", () => {
    const venueOnly = updateMatchBodySchema.safeParse({
      venue: "Parque La Carolina",
    });
    expect(venueOnly.success).toBe(true);
    if (!venueOnly.success) return;
    expect(venueOnly.data).not.toHaveProperty("description");
    expect(venueOnly.data.description).toBeUndefined();

    const empty = updateMatchBodySchema.safeParse({ description: "" });
    expect(empty.success).toBe(true);
    if (!empty.success) return;
    expect(empty.data.description).toBeNull();

    const cleared = updateMatchBodySchema.safeParse({ description: null });
    expect(cleared.success).toBe(true);
    if (!cleared.success) return;
    expect(cleared.data.description).toBeNull();
  });
});
