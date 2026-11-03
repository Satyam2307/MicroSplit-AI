# MicroSplit AI — Provider-Independent Payout Architecture

**Document Version:** 1.0.0  
**Date:** 2026-11-03  
**Status:** Architecture Proposal & Migration Strategy (Pending Approval)  
**Authors:** Antigravity Team & MicroSplit AI Engineering  

---

## 1. Architectural Principles & Invariants

MicroSplit AI is designed as a provably deterministic, human-governed revenue distribution system. The payout execution layer is simply the external settlement mechanism; it must never dictate or alter the core domain model.

### Absolute Safety Invariants
1. **Deterministic Calculation Remains Pure:** The split calculation (`calculateConsistencySplit`, largest-remainder allocation, conservation invariants) is 100% deterministic, testable, and untouched. AI (Gemini) remains strictly confined to evidence proposal extraction and is never permitted to calculate, approve, or disburse money.
2. **Snapshot Immutability:** Payouts can only be dispatched against a persisted, approved `SplitRun` whose recomputed SHA-256 snapshot checksum exactly matches `run.checksum`.
3. **Approval Gating:** Payouts require an explicit, persisted human approval (`Approval.decision === "approved"`) by an authorized squad owner or approver.
4. **Durable Claims & Single Flight:** One payout batch claim per split run (`runId` unique constraint). Claims are created inside a serializable database transaction *before* network I/O.
5. **No Blind Retries:** If an API call times out or returns an unexpected error, the batch status is marked `submission_unknown`. The claim is **never released, deleted, or blindly retried** without prior provider reconciliation.
6. **Preservation of Existing Claims:** The existing PayPal batch with sender batch ID `01603e08029d6495e291d714eec029` (status `submission_unknown`, \$10.00 total) must remain completely preserved and unmutated.

---

## 2. Provider-Independent Abstraction

We introduce a clean separation between the **Payout Orchestration Engine** (database claims, leases, reconciliation, auditing) and the **Payout Execution Providers** (PayPal, Cashfree, RazorpayX).

```mermaid
flowchart TD
  subgraph Core Domain [Deterministic Domain & Audit Layer]
    ApprovedRun[Approved Split Run Snapshot] --> PayoutOrchestrator[Payout Orchestrator Service]
    PayoutOrchestrator --> ClaimDB[(Serializable DB Claim & Leases)]
    AuditDB[(Append-Only Audit Logs)] --- PayoutOrchestrator
  end

  subgraph Provider Layer [Provider-Independent Abstraction]
    PayoutOrchestrator --> PayoutRegistry[Payout Provider Registry]
    PayoutRegistry --> Interface[<<interface>> PayoutProvider]
  end

  subgraph Concrete Adapters [Provider Adapters]
    Interface --> CashfreeAdapter[CashfreePayoutProvider (India / INR)]
    Interface --> PayPalAdapter[PayPalPayoutProvider (Global / USD)]
    Interface --> RazorpayXAdapter[RazorpayXPayoutProvider (Future)]
  end

  subgraph External Networks [External Payment Rails]
    CashfreeAdapter -->|UPI / IMPS API| CashfreeAPI[Cashfree Sandbox / Live]
    PayPalAdapter -->|v1 Payouts API| PayPalAPI[PayPal Sandbox]
  end
```

---

## 3. TypeScript Interface Specifications

### 3.1 Unified Domain Types (`src/lib/payout-provider/types.ts`)

```typescript
export type PayoutProviderName = "paypal" | "cashfree" | "razorpayx";

export type PayoutDestinationType = "EMAIL" | "UPI" | "BANK_ACCOUNT";

export type UnifiedBatchStatus =
  | "created"
  | "submitting"
  | "submission_unknown"
  | "processing"
  | "success"
  | "denied"
  | "canceled"
  | "completed_with_issues";

export type UnifiedItemStatus =
  | "created"
  | "pending"
  | "success"
  | "failed"
  | "unclaimed"
  | "returned"
  | "blocked";

export interface ConfirmedDestination {
  type: PayoutDestinationType;
  // Destination details (only one set is populated based on type)
  email?: string;
  upiVpa?: string;
  bankAccount?: {
    accountNumber: string;
    ifsc: string;
    accountHolderName: string;
  };
  maskedIdentifier: string;
}

export interface ProviderItemRequest {
  senderItemId: string; // Deterministic 30-char hex identifier
  lineId: string;
  memberId: string;
  amountMinor: number;
  currency: string;
  destination: ConfirmedDestination;
  narration?: string;
}

export interface ProviderBatchRequest {
  senderBatchId: string; // Deterministic 30-char hex identifier
  runId: string;
  squadId: string;
  currency: string;
  totalMinor: number;
  items: ProviderItemRequest[];
  emailSubject?: string;
}

export interface ProviderBatchSubmissionResult {
  providerBatchId: string;
  initialStatus: UnifiedBatchStatus;
  rawProviderStatus: string;
}

export interface ProviderItemReconcileResult {
  senderItemId: string;
  providerItemId?: string | null;
  status: UnifiedItemStatus;
  failureReason?: string | null;
}

export interface ProviderBatchReconcileResult {
  providerBatchId: string;
  batchStatus: UnifiedBatchStatus;
  rawProviderStatus: string;
  items: ProviderItemReconcileResult[];
}

export interface WebhookVerificationResult {
  isValid: boolean;
  eventId?: string;
  eventType?: string;
  parsedBatch?: {
    senderBatchId?: string;
    providerBatchId?: string;
    status: UnifiedBatchStatus;
  };
  parsedItem?: {
    senderItemId?: string;
    providerItemId?: string;
    status: UnifiedItemStatus;
    failureReason?: string | null;
  };
}
```

### 3.2 Core Provider Interface (`src/lib/payout-provider/interface.ts`)

```typescript
export interface PayoutProvider {
  readonly name: PayoutProviderName;
  readonly supportedCurrencies: readonly string[];
  readonly supportedDestinationTypes: readonly PayoutDestinationType[];

  /**
   * Verify environment variables and configuration readiness.
   */
  assertConfigured(): void;

  /**
   * Submit an immutable batch of items to the external provider.
   */
  submitBatch(request: ProviderBatchRequest): Promise<ProviderBatchSubmissionResult>;

  /**
   * Query the provider for current batch and item execution statuses.
   */
  reconcileBatch(providerBatchId: string): Promise<ProviderBatchReconcileResult>;

  /**
   * Verify authenticity of an incoming HTTP webhook.
   */
  verifyWebhook(headers: Record<string, string>, rawBody: string): Promise<boolean>;

  /**
   * Parse an incoming verified webhook into unified batch or item updates.
   */
  parseWebhookEvent(rawBody: string): WebhookVerificationResult | null;
}
```

---

## 4. Provider Implementation Details

### 4.1 Cashfree Payouts Adapter (`CashfreePayoutProvider`)
* **Currency Mapping:** Strictly `INR`. If pool currency is `USD`, Cashfree rejects submission.
* **Batch Submission:** Calls Cashfree Batch Transfer V2 API:
  * Headers: `x-client-id`, `x-client-secret`, `x-api-version: 2024-01-01`.
  * Endpoint: `https://sandbox.cashfree.com/payout/transfers/batch`.
  * Maps `senderBatchId` to `batch_transfer_id`.
  * Maps each item's `senderItemId` to Cashfree's `transfer_id`.
  * Maps `UPI` destinations to:
    ```json
    {
      "transfer_id": item.senderItemId,
      "transfer_amount": item.amountMinor / 100,
      "transfer_mode": "upi",
      "beneficiary_details": {
        "beneficiary_name": item.destination.bankAccount?.accountHolderName ?? "Squad Contributor",
        "beneficiary_vpa": item.destination.upiVpa
      }
    }
    ```
  * Maps `BANK_ACCOUNT` destinations to:
    ```json
    {
      "transfer_id": item.senderItemId,
      "transfer_amount": item.amountMinor / 100,
      "transfer_mode": "banktransfer",
      "beneficiary_details": {
        "beneficiary_name": item.destination.bankAccount!.accountHolderName,
        "beneficiary_account_number": item.destination.bankAccount!.accountNumber,
        "beneficiary_ifsc": item.destination.bankAccount!.ifsc
      }
    }
    ```
* **Reconciliation:** Calls `GET https://sandbox.cashfree.com/payout/transfers/batch/{batch_transfer_id}` and maps statuses (`RECEIVED` $\rightarrow$ `processing`, `SUCCESS` $\rightarrow$ `success`, `FAILED` $\rightarrow$ `failed`).
* **Webhook Signature Verification:** Calculates `crypto.createHmac("sha256", clientSecret).update(timestamp + rawBody).digest("base64")` and compares with `x-webhook-signature` using timing-safe comparison.

### 4.2 PayPal Payouts Adapter (`PayPalPayoutProvider`)
* Wraps the existing, tested PayPal logic from `src/lib/paypal.ts`.
* Enforces `USD` currency only.
* Enforces `EMAIL` destination only.
* Retains current error sanitization, Sandbox host assertion, and certificate-based webhook verification.

---

## 5. Recipient Management Design for Indian Payouts

Currently, `Membership` records store a single `payoutReceiver` (PayPal email string) and `payoutReceiverType` (`EMAIL`). For Indian squads, contributors must be able to specify either a **UPI ID (VPA)** or a **Bank Account**.

### 5.1 Privacy & Encryption Model
Bank account details are sensitive personal financial information. Under standard data protection best practices:
1. **Never Plaintext in DB:** Bank account numbers must be encrypted at rest using authenticated encryption (**AES-256-GCM**).
2. **Server-Only Key:** The encryption key (`PAYOUT_DESTINATION_ENCRYPTION_KEY`) is stored securely in server environment variables and never exposed to the client.
3. **Display Masking:**
   * UPI: `p***@okhdfcbank`
   * Bank Account: `••••••••5678 (IFSC: HDFC0001234)`
4. **Ordinary API Privacy:** Squad listing endpoints (`GET /api/squads/[id]/members`) only return masked representations to other squad members. Only the authenticated member themselves can view their own destination status.
5. **Historical Snapshotting:** When a split run is paid, the exact destination details (masked representation + encrypted payload) are snapshotted onto the `PayoutItem` record. If a user subsequently changes their bank account in the squad, past payout audit trails remain intact and unaltered.

### 5.2 Destination Validation Rules

| Destination Type | Validation Rules | Sanitization / Masking |
| :--- | :--- | :--- |
| **UPI ID (`VPA`)** | `^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$` | `u***@bank` |
| **Bank Account** | Account: 9–18 digits (`^\d{9,18}$`)<br>IFSC: 11 chars (`^[A-Z]{4}0[A-Z0-9]{6}$`)<br>Name: 2–100 chars (`^[a-zA-Z\s.]{2,100}$`) | `••••••••1234`<br>`IFSC: HDFC0001234` |
| **PayPal Email** | RFC 5322 bounded email (`isValidPayPalEmail`) | `p***@example.com` |

---

## 6. Database Schema Evolution Analysis

### Can the current Prisma schema support multiple providers without modification?
* **Technically:** One *could* abuse existing columns by overloading `payout_receiver` with JSON strings, stuffing Cashfree batch IDs into `paypal_batch_id`, and using `paypal_webhook_events` for Cashfree events.
* **Architecturally:** **This is unacceptable.** Overloading columns degrades type safety, creates confusion during audit log reviews, risks exposing unencrypted bank account numbers, and creates fragile code.

### Proposed Schema Evolution (Backwards-Compatible)

We propose an additive, backwards-compatible migration that preserves all existing tables and records:

```prisma
// ─── Payout Batches (Enhanced) ──────────────────────────────
model PayoutBatch {
  id                    String    @id @default(cuid())
  runId                 String    @map("run_id")
  provider              String    @default("paypal") // "paypal" | "cashfree" | "razorpayx"
  senderBatchId         String    @unique @map("sender_batch_id")
  providerBatchId       String?   @map("provider_batch_id") // General provider batch ID
  paypalBatchId         String?   @map("paypal_batch_id")   // Retained for legacy records
  status                String    @default("created")
  totalMinor            Int       @default(0) @map("total_minor")
  currency              String    @default("USD")
  submissionAttemptedAt DateTime? @map("submission_attempted_at")
  createdAt             DateTime  @default(now()) @map("created_at")

  run   SplitRun     @relation(fields: [runId], references: [id])
  items PayoutItem[]

  @@unique([runId])
  @@map("payout_batches")
}

// ─── Payout Items (Enhanced) ───────────────────────────────
model PayoutItem {
  id                    String  @id @default(cuid())
  batchId               String  @map("batch_id")
  lineId                String  @map("line_id")
  senderItemId          String  @unique @map("sender_item_id")
  providerItemId        String? @map("provider_item_id")
  paypalItemId          String? @map("paypal_item_id") // Retained for legacy records
  destinationType       String  @default("EMAIL") @map("destination_type") // EMAIL | UPI | BANK_ACCOUNT
  destinationMasked     String  @default("") @map("destination_masked")
  recipientEmail        String  @default("") @map("recipient_email") // Retained for backward compat
  amountMinor           Int     @map("amount_minor")
  status                String  @default("created")
  failureReason         String? @map("failure_reason")

  batch PayoutBatch @relation(fields: [batchId], references: [id], onDelete: Cascade)
  line  SplitLine   @relation(fields: [lineId], references: [id])

  @@map("payout_items")
}

// ─── Member Payout Destinations (New Clean Model) ───────────
model MemberPayoutDestination {
  id             String    @id @default(cuid())
  membershipId   String    @map("membership_id")
  type           String    @map("type") // EMAIL | UPI | BANK_ACCOUNT
  maskedValue    String    @map("masked_value")
  encryptedData  String?   @map("encrypted_data") @db.Text // AES-256-GCM ciphertext for bank details
  isConfirmed    Boolean   @default(false) @map("is_confirmed")
  confirmedAt    DateTime? @map("confirmed_at")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  membership     Membership @relation(fields: [membershipId], references: [id], onDelete: Cascade)

  @@unique([membershipId, type])
  @@map("member_payout_destinations")
}

// ─── Generic Webhook Event Deduplication ─────────────────────
model WebhookEvent {
  id              String   @id @default(cuid())
  provider        String   // "paypal" | "cashfree" | "razorpayx"
  providerEventId String   @map("provider_event_id")
  eventType       String   @map("event_type")
  processedAt     DateTime @default(now()) @map("processed_at")
  createdAt       DateTime @default(now()) @map("created_at")

  @@unique([provider, providerEventId])
  @@map("webhook_events")
}
```

> [!NOTE]
> All existing records (including the existing `$10` `submission_unknown` batch) are 100% compatible with this schema. No legacy columns are deleted or made required without defaults.

---

## 7. Existing Files Requiring Updates

| File Path | Nature of Changes |
| :--- | :--- |
| `src/lib/payout-safety.ts` | Expand validation helpers to support UPI VPAs and IFSC bank accounts; update status mapping to unify Cashfree and PayPal statuses. |
| `src/lib/destination-crypto.ts` *(New)* | AES-256-GCM encryption and decryption utilities for sensitive bank details. |
| `src/lib/payout-provider/*` *(New)* | Provider interfaces, registry factory, and `CashfreePayoutProvider` implementation. |
| `src/app/api/split-runs/[id]/payout/route.ts` | Replace hardcoded PayPal calls with `getPayoutProvider(squad.currency)`. Check recipient destinations based on provider type. |
| `src/app/api/payouts/[id]/reconcile/route.ts` | Delegate reconciliation to provider abstraction instead of direct PayPal client call. |
| `src/app/api/webhooks/cashfree/route.ts` *(New)* | Dedicated Cashfree webhook route with HMAC signature verification and deduplication. |
| `src/app/api/squads/[id]/members/route.ts` | Support updating UPI and Bank Account destinations with encryption and confirmation timestamps. |
| `src/app/squads/[id]/page.tsx` | Add UI tabs for entering UPI ID or Bank Details (Account + IFSC + Holder Name). |
| `src/app/runs/[id]/page.tsx` | Display selected payout provider (Cashfree / PayPal) and destination breakdown before confirming submission. |
| `src/app/payouts/page.tsx` | Display provider badge and masked destinations (`u***@upi`, `••••5678`). |

---

## 8. Prioritized Implementation Plan

### Stage 1: Provider Abstraction & Interface Foundation
* Create `src/lib/payout-provider/types.ts` and `interface.ts`.
* Extract existing PayPal logic into `src/lib/payout-provider/paypal-provider.ts` without modifying its behavior.
* Verify all 63 existing tests pass with the PayPal provider wrapper.

### Stage 2: Indian Recipient Management & Encryption
* Implement `src/lib/destination-crypto.ts` with comprehensive unit tests for encryption, decryption, and key rotation readiness.
* Update `src/lib/payout-safety.ts` with regex validators for UPI VPAs, IFSC codes, and Indian bank account masking.
* Extend squad membership API to securely store and retrieve masked UPI/Bank destinations.

### Stage 3: Cashfree Sandbox Integration & Unit Tests
* Implement `src/lib/payout-provider/cashfree-provider.ts`.
* Implement mocked test suites in `tests/cashfree-client.test.ts` covering:
  * Batch request payload serialization.
  * HMAC-SHA256 signature verification over raw body + timestamp.
  * Error parsing and diagnostics sanitization.
  * Status reconciliation mappings (`RECEIVED`, `SUCCESS`, `FAILED`, `REVERSED`).

### Stage 4: Persistent Payout Execution & Reconciliation
* Update `POST /api/split-runs/[id]/payout` to dynamically select the provider based on squad currency (`INR` $\rightarrow$ Cashfree, `USD` $\rightarrow$ PayPal).
* Update `POST /api/payouts/[id]/reconcile` to support Cashfree batch queries.
* Implement `POST /api/webhooks/cashfree` with durable deduplication in `WebhookEvent`.

### Stage 5: End-to-End Testing with Cashfree Sandbox
* Create an approved split run for an INR squad with two members (one UPI destination, one Bank Account destination).
* Execute live payout against Cashfree Sandbox.
* Verify real Cashfree `batch_transfer_id` and item `transfer_id`s in database.
* Reconcile status to verify final `paid` state.

### Stage 6: UI Integration & Demo Preparation
* Enhance the Squad Settings UI to let members configure UPI VPAs or Bank Accounts with live validation.
* Update the Split Run Detail page to show the provider badge (Cashfree Sandbox) and currency (₹ INR).
* Polish the Payouts history page with provider-aware badges and error diagnostics.

