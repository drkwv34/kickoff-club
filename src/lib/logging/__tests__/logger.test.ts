import { describe, expect, it, vi } from "vitest";
import { createLogger, log, newRequestId } from "../logger";

describe("structured logger", () => {
  it("emits JSON with required NFR-OBS-001 fields", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    log({
      level: "info",
      message: "request complete",
      requestId: "req-1",
      route: "GET /api/health",
      durationMs: 4,
    });
    expect(spy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(String(spy.mock.calls[0]?.[0])) as Record<
      string,
      unknown
    >;
    expect(payload).toMatchObject({
      level: "info",
      message: "request complete",
      requestId: "req-1",
      route: "GET /api/health",
      durationMs: 4,
    });
    expect(typeof payload.timestamp).toBe("string");
    spy.mockRestore();
  });

  it("redacts passwords and session tokens", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    log({
      level: "info",
      message: "ignored",
      password: "super-secret",
      token: "raw-session",
    });
    const line = String(spy.mock.calls[0]?.[0]);
    expect(line).not.toContain("super-secret");
    expect(line).not.toContain("raw-session");
    expect(line).toContain("[redacted]");
    spy.mockRestore();
  });

  it("createLogger binds requestId", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const logger = createLogger({ requestId: "abc", route: "POST /x" });
    logger.warn("slow query", { durationMs: 90 });
    const payload = JSON.parse(String(spy.mock.calls[0]?.[0])) as Record<
      string,
      unknown
    >;
    expect(payload.requestId).toBe("abc");
    expect(payload.route).toBe("POST /x");
    expect(payload.durationMs).toBe(90);
    spy.mockRestore();
  });

  it("newRequestId returns a uuid", () => {
    expect(newRequestId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });
});
