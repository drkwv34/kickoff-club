import { NextResponse } from "next/server";
import {
  DomainError,
  DomainErrorCode,
  httpStatusForDomainCode,
  mapUnknownError,
  toPublicErrorBody,
} from "@/lib/errors/domain-error";
import { createLogger, newRequestId, type Logger } from "@/lib/logging/logger";

export type ApiContext = {
  request: Request;
  requestId: string;
  logger: Logger;
};

export async function handleApi(
  request: Request,
  route: string,
  handler: (ctx: ApiContext) => Promise<Response>,
): Promise<Response> {
  const requestId =
    request.headers.get("x-request-id")?.trim() || newRequestId();
  const logger = createLogger({ requestId, route });
  const started = Date.now();

  try {
    const response = await handler({ request, requestId, logger });
    logger.info("ok", {
      durationMs: Date.now() - started,
      status: response.status,
    });
    response.headers.set("x-request-id", requestId);
    return response;
  } catch (err) {
    const mapped = mapUnknownError(err);
    const status = httpStatusForDomainCode(mapped.code);
    if (status >= 500) {
      logger.error("unhandled", {
        durationMs: Date.now() - started,
        code: mapped.code,
        status,
      });
    } else {
      logger.warn("request failed", {
        durationMs: Date.now() - started,
        code: mapped.code,
        status,
      });
    }
    const response = NextResponse.json(toPublicErrorBody(mapped), { status });
    response.headers.set("x-request-id", requestId);
    return response;
  }
}

export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new DomainError(DomainErrorCode.VALIDATION_ERROR, "Invalid request", {
      fields: { _root: "Body must be JSON" },
    });
  }
}
