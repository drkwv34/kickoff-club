# Spec Delta

## Purpose

Local load-test tooling for the Compose app, with a recorded p95 so reviewers can repeat the NFR-PERF-001 check.

## ADDED Requirements

### Requirement: Autocannon script against Compose

The repository SHALL provide a script under `scripts/perf/` that runs autocannon with 50 connections against the local Compose app.

#### Scenario: Perf script uses 50 connections

- **WHEN** a reviewer runs the documented performance script against Compose
- **THEN** the script invokes autocannon with 50 connections

### Requirement: README records measured p95

The README SHALL record the p95 latency measured by running that script against local Compose.

#### Scenario: README includes a p95 figure

- **WHEN** a reviewer reads the README performance section
- **THEN** it includes a p95 latency measured from the 50-connection Compose run
