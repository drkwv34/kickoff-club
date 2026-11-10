/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CreateSeriesForm } from "../create-series-form";

vi.mock("../use-csrf-token", () => ({
  useCsrfToken: () => "csrf-test",
}));

const FIELDS = {
  title: "Title is required",
  venue: "Venue is required",
};

describe("CreateSeriesForm field errors", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            code: "VALIDATION_ERROR",
            message: "Invalid request",
            fields: FIELDS,
          }),
          { status: 400, headers: { "content-type": "application/json" } },
        ),
      ),
    );
  });

  it("shows a message under each input from a 400 fields map", async () => {
    render(
      <CreateSeriesForm
        groupId="11111111-1111-4111-8111-111111111101"
        defaultTimezone="America/Guayaquil"
        defaultSport="futbol"
      />,
    );

    fireEvent.change(screen.getByLabelText("First date (match timezone)"), {
      target: { value: "2026-12-01" },
    });
    fireEvent.change(screen.getByLabelText("Start time"), {
      target: { value: "18:00" },
    });
    fireEvent.change(screen.getByLabelText("End time"), {
      target: { value: "19:00" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Create series" }).closest("form")!);

    const title = await screen.findByLabelText("Title");
    const venue = screen.getByLabelText("Venue");
    expect(screen.getByText("Title is required")).toBeTruthy();
    expect(screen.getByText("Venue is required")).toBeTruthy();
    await waitFor(() => {
      expect(title.getAttribute("aria-describedby")).toBe("series-title-error");
      expect(venue.getAttribute("aria-describedby")).toBe("series-venue-error");
    });
  });
});
