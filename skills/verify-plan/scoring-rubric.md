# Verify-Plan V2 — Quality Scoring Rubric

> **WARNING: REPORT-ONLY**
> This score does NOT control the convergence loop. Binary resolution tracking does.
> The loop exits when BLOCKING and SIGNIFICANT challenge counts hit zero — not when the score
> reaches a threshold. This rubric is computed once, at the end of the final iteration, and
> appears in the final report as context. It has no operational effect.

> Calibration examples use generic software engineering scenarios. Apply the same scoring logic to your domain.

---

## 1. Dimensions

| Dimension | Weight | Low (1-3) | Mid (5-6) | High (8-10) |
|-----------|--------|-----------|-----------|-------------|
| Approach Soundness | 25% | Wrong tool for the job | Reasonable with gaps | Optimal for constraints |
| Risk Coverage | 20% | Major risks unaddressed | Known risks addressed | Edge cases considered |
| Assumption Validity | 15% | Key assumptions wrong | Assumptions plausible | Assumptions verified |
| Integration Feasibility | 15% | APIs/deps don't exist | Deps exist, untested | Deps verified, compatible |
| Unknowns Coverage | 15% | Only known unknowns addressed | Some context surfaced | All 3 modes ran, findings integrated |
| Constraint Alignment | 10% | Violates constraints | Mostly aligned | Fully aligned |

---

## 2. Calibration Examples

Each dimension has three anchors — Low, Mid, High — grounded in realistic plan failures.

### Approach Soundness (25%)

**Low (3):** "Plan uses polling every 30 seconds for real-time order status updates when a WebSocket
infrastructure already exists in the codebase and is used by two adjacent modules. Polling will
add unnecessary server load and introduce 30-second latency on status changes."

**Mid (7):** "Plan uses REST API for the integration. GraphQL would reduce over-fetching and be
more efficient given the nested data model, but REST works and the team has existing patterns
and middleware for REST. Trade-off is acceptable."

**High (9):** "Plan leverages the existing event bus pattern proven in three other modules.
GraphQL-over-subscriptions was evaluated and rejected due to the coupling it would introduce
to the frontend's state management layer. The current approach is consistent with established
architecture and avoids that coupling."

---

### Risk Coverage (20%)

**Low (2):** "Plan makes no mention of failure handling for the external payment gateway API call. No retry
logic, no timeout, no fallback. If the gateway is down during checkout, the entire transaction
fails silently with no audit trail."

**Mid (5):** "Plan acknowledges the payment gateway can fail and specifies a retry with exponential
backoff. Does not address what happens if all retries exhaust — whether transactions are queued,
dropped, or flagged for manual review."

**High (9):** "Plan specifies retry with exponential backoff (3 attempts, 2s/4s/8s), a dead-letter
queue for exhausted retries, an alert to the operations dashboard, and a daily reconciliation
job that catches anything that fell through. Failure modes enumerated and each has a handler."

---

### Assumption Validity (15%)

**Low (2):** "Plan assumes the vendor REST API accepts bulk submissions. Researcher Mode 1
found no evidence of a bulk endpoint in the API docs or in the SDK source code.
The only confirmed endpoint is single-record POST. Bulk assumption is unverified and likely wrong."

**Mid (6):** "Plan assumes the authentication token library handles refresh automatically.
Library was last updated 14 months ago. No breaking changes found in the OAuth provider's changelog since then,
but this was not actively verified — it is plausible but unconfirmed."

**High (9):** "Plan assumes the API rate limit is 1000 requests/minute. Researcher Mode 1 confirmed this via
the official API documentation (v3.2, updated 2025-08, rate limits section).
Rate has been stable since the v3.0 release. Assumption is treated as confirmed fact."

---

### Integration Feasibility (15%)

**Low (2):** "Plan calls `api.createRecord()` but no such method exists in the SDK client.
The actual method is `api.records.create()` with a different payload shape. Plan will fail
at the first integration point without modification."

**Mid (5):** "Plan references a webhook endpoint to trigger the data sync pipeline.
The endpoint exists and is publicly documented. The specific response schema for validation errors
has not been tested — the plan assumes a JSON error array, but this was not confirmed against
a live or sandbox call."

**High (9):** "Researcher Mode 1 read the SDK client source at `/lib/sdk/client.ts`
and confirmed `records.create()` accepts the exact payload shape the plan constructs. The method's
error response was also tested against the sandbox environment in a prior session.
Integration is fully verified."

---

### Unknowns Coverage (15%)

**Low (1):** "Only Mode 1 ran. No unknowns were surfaced from codebase context or documentation. No
stress-testing of assumptions. The plan's blind spots — prior decisions, stale knowledge,
adjacent module behavior — were never examined."

**Mid (5):** "Modes 1 and 2 ran. Mode 1 resolved 3 of 4 open challenges. Mode 2 surfaced one
prior decision from git history that slightly changes the recommended approach. Mode 3 did not
run — temporal risks and cascade failures were not probed."

**High (9):** "All three Researcher Modes ran. Mode 1 resolved all BLOCKING challenges with
codebase evidence. Mode 2 surfaced a contradicting architectural decision from 8 months ago that
generated a new SIGNIFICANT challenge, which was then resolved. Mode 3 identified one low-probability
cascade failure and tagged it as DEFERRED with a monitoring recommendation. All findings are
integrated into the final synthesis."

---

### Constraint Alignment (10%)

**Low (2):** "Plan proposes running a background service via cron on a system where cron
is not available. The target platform uses Windows Task Scheduler. Plan would not execute in the
target environment as written."

**Mid (5):** "Plan uses the correct platform tooling and targets the right environment. Does not account for
end-user UX — operator-facing messages use technical jargon and error codes that non-technical
users would not understand."

**High (9):** "Plan uses platform-appropriate tooling, produces user-facing output in plain language
with clear error messages, targets the correct file path conventions, and routes all destructive
operations through a confirmation step. Fully aligned with all stated constraints."

---

## 3. Scoring Rules

### Evidence Requirement
Synthesizer MUST include explicit evidence for each dimension in the final report.
Assertions without evidence are invalid.

**Format (one line per dimension):**
```
Approach Soundness: 8/10 — [evidence: plan reuses event bus pattern from modules X, Y, Z; GraphQL evaluated and rejected, documented in C3 resolution]
Risk Coverage: 6/10 — [evidence: retry logic specified, but exhaustion path not defined; C5 was DEFERRED, not resolved]
Assumption Validity: 9/10 — [evidence: rate limit confirmed via official API documentation; all other assumptions verified in Mode 1]
Integration Feasibility: 7/10 — [evidence: records.create() method confirmed in source; response schema not live-tested]
Unknowns Coverage: 8/10 — [evidence: all 3 modes ran; 4/5 unknowns CONFIRMED, 1 PARTIALLY_RESOLVED]
Constraint Alignment: 9/10 — [evidence: platform-appropriate tooling, plain-language output, correct path conventions, destructive ops gated]
```

### Score Calculation
```
final_score = round(
  (approach_soundness  * 0.25) +
  (risk_coverage       * 0.20) +
  (assumption_validity * 0.15) +
  (integration_feasibility * 0.15) +
  (unknowns_coverage   * 0.15) +
  (constraint_alignment * 0.10)
)
```
Result: integer 1-10. Appears in the final report header as `Quality Score: N/10`.

### Challenger Audit
On the final iteration, the Challenger gets one audit pass over the Synthesizer's scores.
If the Challenger disagrees with any dimension by 2 or more points, the discrepancy is flagged
in the final report under a `Score Dispute` block — both scores shown, both rationales shown,
no automatic resolution. User sees the dispute and decides.

### Score is Informational Only
A plan with score 6 that passes binary convergence (zero BLOCKING, zero SIGNIFICANT open)
gets a PROCEED verdict. A plan with score 9 that has one unresolved BLOCKING gets BLOCKED.
The score never overrides the binary verdict.
