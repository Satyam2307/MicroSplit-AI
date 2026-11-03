# MicroSplit AI — Payout Provider Research for Indian Businesses

**Document Version:** 1.0.0  
**Date:** 2026-11-03  
**Status:** Approved for Architecture Design (No Code/Database Modifications)  
**Authors:** Antigravity Team & MicroSplit AI Engineering  

---

## 1. Executive Summary & Problem Context

During PayPal Sandbox testing of MicroSplit AI, payout submission failed with the following external provider error:

* **Endpoint:** `POST /v1/payments/payouts`
* **HTTP Status:** `403 Forbidden`
* **Provider Error:** `USER_COUNTRY_NOT_ALLOWED`
* **Provider Message:** *"You live in a country that is not allowed to send this payout."*

### Verified Root Cause
Our architectural and operational audit verified that:
1. Sandbox OAuth 2.0 authentication succeeds (HTTP 200).
2. The generated OAuth access token contains the `https://uri.paypal.com/services/payouts` scope.
3. The API endpoint and credentials are properly configured for the PayPal Sandbox environment (`api-m.sandbox.paypal.com`).
4. **The sender account country is India.** According to [PayPal Payouts Supported Features](https://developer.paypal.com/payouts/supported-features/) and the [PayPal API Error Guide](https://developer.paypal.com/api/payments.payouts-batch/v1/errors/user_country_not_allowed/), India is classified under **"Receive and withdraw"** features only.
5. In India, PayPal does **not** permit accounts (neither Personal nor Business) to initiate Payouts API disbursements due to Reserve Bank of India (RBI) regulations governing cross-border remittances, payment aggregators, and domestic currency flow.

### Directive
This is an external regulatory and regional eligibility constraint, not a software defect. Under no circumstances should we:
* Attempt to bypass PayPal's country check using VPNs, proxies, or falsified account locations.
* Switch to live PayPal credentials to "see if it works."
* Compromise the existing deterministic split engine, human approvals, or persistent payout safety.

Instead, MicroSplit AI must evolve to support a **provider-independent payout execution layer**, integrating a legitimate, officially supported Indian payout infrastructure while keeping PayPal available for teams in eligible jurisdictions.

---

## 2. Fundamental Differences Between Payout Methods

Payout methods are not interchangeable. Sending money to a PayPal wallet differs fundamentally from dispatching funds to an Indian bank account or a UPI address:

| Dimension | PayPal Account (Email) | UPI ID (Virtual Payment Address) | Bank Account (IMPS / NEFT / RTGS) |
| :--- | :--- | :--- | :--- |
| **Recipient Identifier** | Valid Email Address (`user@example.com`) | Virtual Payment Address (`user@okhdfcbank`, `mobile@upi`) | Account Number + IFSC + Account Holder Name |
| **Settlement Rail** | Closed-loop PayPal internal ledger | NPCI (National Payments Corporation of India) UPI Switch | RBI / NPCI Banking Network (IMPS, NEFT, RTGS) |
| **Supported Currencies** | Multi-currency (USD, EUR, GBP, AUD, etc.) | **Exclusively INR (Indian Rupee)** | **Exclusively INR (Indian Rupee)** |
| **Settlement Speed** | Instant to recipient's PayPal balance | Instant 24x7x365 (real-time bank debit/credit) | Instant 24x7 for IMPS; batches for NEFT; instant for RTGS |
| **Transaction Limits** | Up to \$20,000/item (subject to sender balance/limits) | Typically ₹1,00,000 (~$1,200) per transaction | IMPS: ₹5,00,000/item; NEFT/RTGS: No statutory upper limit |
| **Privacy & Sensitivity** | Low sensitivity (email is already public) | Low-to-moderate (handle is public, may expose phone/name) | **High sensitivity** (full bank account + branch IFSC must be encrypted at rest and masked in UI/APIs) |
| **Credentials Required** | No password/PIN to receive | **Never requires UPI PIN or OTP to receive money** | **Never requires NetBanking password or OTP to receive money** |
| **Regulatory Framework** | US/International Cross-Border Wire & E-Money | RBI & NPCI Domestic Retail Payment Framework | RBI Core Banking Regulations |

> [!IMPORTANT]
> **Zero Credential Collection Rule:** Payouts in India only ever require a *destination identifier* (UPI VPA or Account Number + IFSC). Any request for UPI PIN, debit card details, NetBanking passwords, or OTPs is fraudulent. MicroSplit AI must only collect and snapshot public/destination identifiers.

---

## 3. Comprehensive Indian Payout Provider Research

We investigated four major payment and banking infrastructure providers operating legitimately in India:
1. **Cashfree Payouts**
2. **RazorpayX Payouts**
3. **Decentro Core Banking / Payouts**
4. **PayU Payouts**

---

### Option 1: Cashfree Payouts

* **Official Documentation:** 
  * [Cashfree Payouts Overview](https://docs.cashfree.com/docs/payouts-api-overview)
  * [Batch Transfer API V2](https://docs.cashfree.com/reference/batchtransferv2)
  * [Webhook Verification Guide](https://docs.cashfree.com/docs/payout-webhooks)
  * [Sandbox Onboarding](https://merchant.cashfree.com/merchants/signup)

#### Eligibility & Verification
* **Indian Registered Business Support:** Fully supported. Accepts Private Limited, Public Limited, LLP, Partnership, and Sole Proprietorships.
* **Sole Proprietor Onboarding:** Supported. Requires business registration document (e.g., GST certificate, Udyam Registration, or Shop & Establishment license) along with PAN and bank account proof.
* **KYC & Business Verification:** Required strictly for **Live/Production** payouts. Live onboarding involves Penny Drop bank verification, business PAN validation, and director/signatory KYC.
* **Sandbox Availability:** **Immediately available without KYC.** Developers can register an account at `merchant.cashfree.com/merchants/signup`, toggle to Test Mode, and generate Test API credentials (`x-client-id`, `x-client-secret`) in under two minutes without uploading any business or tax documents.

#### API & Orchestration Capabilities
* **Payout Rails:** UPI (VPA), IMPS (Bank), NEFT (Bank), RTGS (Bank), Cards, Amazon Pay.
* **Supported Currencies:** Domestic Indian payouts in **INR**.
* **Authentication:** HTTP Request Headers:
  * `x-client-id: <SANDBOX_CLIENT_ID>`
  * `x-client-secret: <SANDBOX_CLIENT_SECRET>`
  * `x-api-version: 2024-01-01`
  * `Content-Type: application/json`
* **Batch Payout Support:** **Native Programmatic Batch API.**
  * Endpoint: `POST /payout/v1/requestBatchTransfer` (or V2 `POST /payout/transfers/batch`).
  * Accepts a caller-defined `batchTransferId` (idempotency key) and an array of individual transfer items with `transferId`, `amount`, and `beneficiaryDetails` (either UPI VPA or Bank Account).
  * Capacity: Up to 10,000 items per batch.
* **Idempotency Support:** First-class client-supplied IDs:
  * `batchTransferId` ensures the batch job is created exactly once.
  * `transferId` for each item ensures no individual recipient is paid twice. Duplicate submissions return the existing transaction record.
* **Webhook Architecture & Signatures:**
  * Cashfree calculates an **HMAC-SHA256** signature over the concatenation of the request timestamp and the raw unparsed request body (`timestamp + rawBody`), keyed with the merchant's `client_secret`.
  * Passed in header: `x-webhook-signature`.
  * Events: `TRANSFER_SUCCESS`, `TRANSFER_FAILED`, `TRANSFER_REVERSED`, `BATCH_TRANSFER_STATUS`.
* **Reconciliation & Status Query:**
  * Item Status: `GET /payout/transfers/{transferId}`
  * Batch Status: `GET /payout/batch-transfers/{batchTransferId}`
  * Highly granular status codes: `RECEIVED`, `PENDING`, `SUCCESS`, `FAILED`, `REVERSED`.
* **Fees & Limits:**
  * Fees: Standard tiered pricing from ₹3 to ₹15 per transaction (depending on volume) + 18% GST.
  * Limits: UPI up to ₹1,00,000/transfer; IMPS up to ₹5,00,000/transfer; NEFT/RTGS unlimited.

---

### Option 2: RazorpayX Payouts

* **Official Documentation:**
  * [RazorpayX Overview](https://razorpay.com/docs/x/)
  * [RazorpayX Payouts API](https://razorpay.com/docs/razorpayx/api/payouts/)
  * [RazorpayX Bulk Payouts](https://razorpay.com/docs/razorpayx/reports-bulk-payouts/bulk-payouts/)
  * [Test Mode & Sandbox Setup](https://razorpay.com/docs/x/test-mode/)

#### Eligibility & Verification
* **Indian Registered Business Support:** Fully supported (Private Limited, Public Limited, LLP, Partnership, Sole Proprietor, Trust/Society).
* **Sole Proprietor Onboarding:** Supported for live mode with Udyam/GST registration and PAN.
* **KYC & Business Verification:** Required for Live mode. Requires opening a RazorpayX Current Account (with partner banks like RBL or ICICI) or a RazorpayX Lite virtual account.
* **Sandbox Availability:** **Immediately available in Test Mode.** Developers can sign up on the Razorpay Dashboard, switch to Test Mode, and generate test keys (`rzp_test_...`) without submitting KYC. Simulated test balance can be recharged directly from the UI.

#### API & Orchestration Capabilities
* **Payout Rails:** UPI (VPA), IMPS (Bank), NEFT (Bank), RTGS (Bank).
* **Supported Currencies:** Domestic Indian payouts in **INR**.
* **Authentication:** HTTP Basic Auth:
  * `Authorization: Basic base64(rzp_test_key_id:rzp_test_key_secret)`
* **Batch Payout Support:** **No Programmatic Batch REST API.**
  * In RazorpayX, "Bulk Payouts" refers strictly to a manual dashboard feature where merchants upload `.xlsx` or `.csv` files.
  * For programmatic API usage, developers must create a **Contact** (`POST /v1/contacts`), create a **Fund Account** (`POST /v1/fund_accounts`), and then loop individual payout calls (`POST /v1/payouts`), or use the **Composite Payout API** (`POST /v1/payouts`) one item at a time.
  * There is no single API call to dispatch an entire batch of 50 members atomically.
* **Idempotency Support:** Header `X-Payout-Idempotency: <UUID>` is mandatory on `POST /v1/payouts`.
* **Webhook Architecture & Signatures:**
  * HMAC-SHA256 signature calculated over the raw request body using a shared secret.
  * Passed in header: `X-Razorpay-Signature`.
  * Events: `payout.processed`, `payout.initiated`, `payout.reversed`, `payout.failed`, `payout.queued`, `payout.updated`.
* **Reconciliation & Status Query:**
  * Status endpoint: `GET /v1/payouts/{payoutId}`.
* **Fees & Limits:**
  * Fees: IMPS/UPI: ₹4 (< ₹1,000), ₹6 (₹1,000 - ₹25,000), ₹9 (> ₹25,000) + 18% GST. NEFT/RTGS: ₹5 flat + 18% GST.
  * Mandatory server IP allowlisting is required in settings.

---

### Option 3: Decentro Core Banking / Payouts

* **Official Documentation:**
  * [Decentro Money Transfer Overview](https://docs.decentro.tech/)
  * [Decentro Payouts / Core Banking](https://docs.decentro.tech/docs/money-transfer-core-banking)

#### Summary Evaluation
* **Positioning:** Decentro is a specialized Banking-as-a-Service (BaaS) infrastructure provider that integrates directly with sponsor banks (Yes Bank, ICICI, Axis).
* **Eligibility & KYC:** Geared toward fintech companies, NBFCs, and platforms. Direct developer sandbox accounts typically require sales team outreach and agreement signing.
* **Batch Support:** Multi-call API orchestration.
* **Verdict:** Overly complex for a hackathon or agile MVP; high onboarding friction compared to self-serve developer platforms.

---

### Option 4: PayU Payouts

* **Official Documentation:**
  * [PayU Payouts Guide](https://devguide.payu.in/payouts/overview/)
  * [PayU Payouts API](https://devguide.payu.in/payouts/api-reference/)

#### Summary Evaluation
* **Positioning:** Solid enterprise disbursement engine supporting UPI, IMPS, and NEFT.
* **Sandbox & Onboarding:** Sandbox exists (`uatoneapi.payu.in`), but onboarding requires traversing PayU's multi-step enterprise onboarding pipeline.
* **Batch Support:** Has batch file upload and API transfer initiation, but developer tooling and documentation freshness lag behind Cashfree and Razorpay.

---

## 4. Head-to-Head Provider Comparison Matrix

| Feature / Criteria | Cashfree Payouts | RazorpayX Payouts | PayPal Payouts (Current) |
| :--- | :--- | :--- | :--- |
| **Supports Indian Sender** | **Yes (Legitimate Domestic Rails)** | **Yes (Legitimate Domestic Rails)** | **No (403 USER_COUNTRY_NOT_ALLOWED)** |
| **Instant Sandbox Access Without KYC** | **Yes (Instant 2-minute signup)** | **Yes (Instant 2-minute signup)** | Yes (Sandbox only; Live blocked for India) |
| **Native Batch Payout API** | **Yes (`requestBatchTransfer`)** | No (Single Payout loop or Dashboard file) | Yes (`POST /v1/payments/payouts`) |
| **Supports UPI (VPA) Payouts** | **Yes (24x7 instant settlement)** | **Yes (24x7 instant settlement)** | No (PayPal wallets only) |
| **Supports Bank Account (IMPS/NEFT)** | **Yes (24x7 instant via IMPS)** | **Yes (24x7 instant via IMPS)** | No (PayPal wallets only) |
| **Idempotency Guarantee** | **Strict (Client `batchTransferId` & `transferId`)** | Strict (Header `X-Payout-Idempotency`) | Strict (Header `PayPal-Request-Id`) |
| **Webhook Signature Method** | HMAC-SHA256 (`timestamp + rawBody`) | HMAC-SHA256 (`rawBody`) | Certificate URL + Public Key verification |
| **Currency Compatibility** | **INR** | **INR** | **USD / Foreign Currencies** |
| **Reconciliation API** | Full Batch & Item Status endpoints | Item-level Status endpoint | Batch & Item Status endpoints |
| **Fit for MicroSplit Architecture** | **Exact 1:1 match with Batch orchestration** | Moderate (requires backend item loop) | Native Batch (but country blocked) |

---

## 5. Architectural Recommendation & Justification

### Recommendation: **Cashfree Payouts** (Primary) with **RazorpayX** (Secondary)

### Core Justifications for Recommending Cashfree Payouts:
1. **Architectural Parity with MicroSplit AI:**
   MicroSplit AI's batch payout state machine (`PayoutBatch` holding $N$ `PayoutItem`s with durable unique claims and atomic submission leases) was modeled after batch-oriented APIs. Cashfree is the **only major Indian provider providing a first-class programmatic REST Batch Transfer API**. We can map `runId` directly to `batchTransferId` and `senderItemId` directly to Cashfree's `transferId`, preserving our exact concurrency and deduplication semantics.
2. **Instant Developer Sandbox (Zero KYC Barrier):**
   Anyone with an email and Indian mobile number can sign up immediately on Cashfree's merchant portal, switch to Test Mode, copy `x-client-id` and `x-client-secret`, and test real API calls against `https://sandbox.cashfree.com/payout/` without submitting business documents or waiting for human approval.
3. **Versatile Indian Beneficiary Support:**
   Recipients can choose between:
   * **UPI ID (`VPA`)**: The most frictionless method for creators, freelancers, and squad contributors. Requires only a handle like `user@upi`, avoiding the collection or exposure of bank account numbers.
   * **Bank Account (IMPS)**: For traditional contractors needing direct bank deposits.
4. **Resilient Webhook & Reconciliation Infrastructure:**
   Cashfree's HMAC-SHA256 webhook signing allows clean, self-contained verification in Node.js using standard `node:crypto`, without requiring external certificate fetching. The `GET /payout/batch-transfers/{batchTransferId}` endpoint allows rock-solid status recovery from uncertain submission states.

---

## 6. Official References & Citation Links

1. **PayPal Payouts Limitations:**
   * [PayPal Payouts Supported Features & Countries](https://developer.paypal.com/payouts/supported-features/)
   * [PayPal API Errors: USER_COUNTRY_NOT_ALLOWED](https://developer.paypal.com/api/payments.payouts-batch/v1/errors/user_country_not_allowed/)
2. **Cashfree Documentation:**
   * [Cashfree Payouts Product Guide](https://www.cashfree.com/payouts/)
   * [Cashfree Payouts API Overview & V2 Specification](https://docs.cashfree.com/docs/payouts-api-overview)
   * [Cashfree Batch Transfer API Reference](https://docs.cashfree.com/reference/batchtransferv2)
   * [Cashfree Webhooks & HMAC Verification](https://docs.cashfree.com/docs/payout-webhooks)
3. **RazorpayX Documentation:**
   * [RazorpayX API Reference](https://razorpay.com/docs/razorpayx/api/)
   * [RazorpayX Payouts Lifecycle & Idempotency](https://razorpay.com/docs/razorpayx/api/payouts/)
   * [RazorpayX Test Mode Guidelines](https://razorpay.com/docs/x/test-mode/)
4. **NPCI & RBI Regulatory Standards:**
   * [NPCI Unified Payments Interface (UPI) System Specifications](https://www.npci.org.in/what-we-do/upi/product-overview)
   * [RBI Guidelines on Payment Aggregators & Cross-Border Disbursements](https://www.rbi.org.in/)

