#!/usr/bin/env node
import autocannon from "autocannon";

const url = process.env.PERF_URL ?? "http://127.0.0.1:3000/api/ready";
const connections = Number(process.env.PERF_CONNECTIONS ?? 50);
const duration = Number(process.env.PERF_DURATION ?? 10);

if (!Number.isFinite(connections) || connections <= 0) {
  console.error("PERF_CONNECTIONS must be a positive number");
  process.exit(1);
}

const result = await autocannon({
  url,
  connections,
  duration,
  title: "kickoff-club compose",
});

autocannon.printResult(result, process.stdout);

const p90 = result.latency.p90;
const p975 = result.latency.p97_5;
const p95 = interpolatedPercentile(90, p90, 97.5, p975, 95);

console.log("");
console.log(
  JSON.stringify(
    {
      url,
      connections: result.connections,
      duration: result.duration,
      requests: result.requests.total,
      latency: {
        min: result.latency.min,
        average: result.latency.average,
        p50: result.latency.p50,
        p90,
        p95,
        p97_5: p975,
        p99: result.latency.p99,
        max: result.latency.max,
      },
      errors: result.errors,
      timeouts: result.timeouts,
      non2xx: result.non2xx,
      statusCodeStats: result.statusCodeStats,
    },
    null,
    2,
  ),
);
console.log(`p95_ms=${p95}`);

function interpolatedPercentile(p0, v0, p1, v1, n) {
  if (typeof v0 !== "number" || typeof v1 !== "number") {
    throw new Error("autocannon result is missing p90/p97.5");
  }
  const t = (n - p0) / (p1 - p0);
  return Math.round(v0 + t * (v1 - v0));
}
