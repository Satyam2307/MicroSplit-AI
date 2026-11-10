# MicroSplit AI

> **Autonomous squad revenue attribution platform with tamper-evident cryptographic audit ledger & single-click PayPal batch disbursements.**  
> Built for the **PayPal AI Hackathon 2026** using Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion, Prisma + PostgreSQL, Google Gemini 3.8 Flash, and the PayPal Payouts v1 Batch REST API.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests: 63 Passing](https://img.shields.io/badge/Tests-63%20Passing-brightgreen.svg)](#-automated-test-suite)
[![PayPal: Payouts v1 Batch API](https://img.shields.io/badge/PayPal-Payouts%20v1%20Sandbox-003087.svg)](#-how-paypal-is-integrated)
[![AI: Gemini 3.8 Flash](https://img.shields.io/badge/AI-Google%20Gemini%203.8%20Flash-4285F4.svg)](#-how-ai-is-integrated)

---

## 🏆 PayPal AI Hackathon 2026 Submission

### Overview
Modern creator squads, open-source maintainers, freelance collectives, and autonomous agencies need a trustworthy, objective method to verify contributor work, calculate revenue splits deterministically, and disburse earnings across global members.

**MicroSplit AI puts AI behind the wheel of squad compensation and financial settlement:**
1. **AI Work Attribution**: Google Gemini 3.8 Flash autonomously parses multi-format deliverables (PDFs, invoices, Git logs, receipts) into structured contribution proposals.
2. **Deterministic FinTech Math**: Largest-remainder integer-cents split engine (supporting Weighted Points, Tiered, Milestone, and Fixed % rules) ensures exactly **zero cents are lost or created**.
3. **Consistency Streak Engine**: Rewards sustained contributions with timezone-aware streaks and approver freeze grants.
4. **PayPal Batch Settlements**: One-click execution initiates PayPal Payouts v1 Batch API disbursements directly to members' confirmed PayPal accounts.
5. **Cryptographic Audit Trail**: Every grant, run, approval, and disbursement is sealed onto a SHA-256 tamper-evident hash chain.

---

## 💳 How PayPal is Integrated
MicroSplit AI deeply integrates the **PayPal Payouts v1 REST API** (`POST /v1/payments/payouts`):
- **Batch Disbursements**: Sends multi-recipient payouts simultaneously from a single squad revenue event.
- **Idempotent Safety**: Deterministic sender batch IDs (`microsplit_<runId>_<timestamp>`) and item-level sender IDs prevent double-payouts.
- **Recipient Confirmation**: Enforces verified recipient emails with data-masking security (`a***@domain.com`) in reviewer views.
- **Durable Claim Ledger**: Pre-allocates claims before network I/O; securely updates item statuses (`SUCCESS`, `PENDING`, `BLOCKED`) upon receiving PayPal webhook callbacks.

> [!TIP]
> **PayPal Sandbox Setup for Judges:**  
> The PayPal Payouts API requires a Sandbox Business Account configured with country **United States (US)**. Ensure `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` in `.env` are from a US-based sandbox business app.

---

## 🤖 How AI is Integrated
MicroSplit AI utilizes **Google Gemini 3.8 Flash** (`@google/genai`) for multi-modal work attribution:
- **Evidence Extraction**: Automatically analyzes unstructured contribution proofs (PDF documents, timesheets, deliverables, receipts) uploaded to private Supabase storage.
- **Structured Proposal Extraction**: Extracts contributor names, dates, deliverables, and effort metrics into typed proposals, without letting the model fabricate arbitrary financial allocations.
- **Human-in-the-Loop Review**: Proposals undergo exact-only squad identity matching; squad approvers can correct, confirm, or reject proposals before they enter split-eligible calculations.
- **MicroSplit Concierge**: An embedded AI chatbot assistant capable of answering squad financial queries, explaining split methodologies, and navigating ledger audits.

---

## ⚡ Quick-Start for Judges & Evaluators

### Option A: Zero-Friction 1-Click Demo Evaluation
To allow hackathon judges to evaluate full workflows immediately without setting up OAuth keys:
1. Open the application (locally or on deployed URL).
2. Navigate to **`/login`** and click **"Use Alex Rivera Demo Profile"** (or click **"Sign In & Launch Console"**).
3. Navigate through the core features:
   - **Squads (`/squads`)**: View active squads, member shares, and currency pools.
   - **Split Builder (`/splits/new`)**: Click **"Load $1,000 Canonical Example"** to test live sliders for Weighted Points, Consistency Streaks, and Tiered rules.
   - **Evidence & AI (`/evidence`)**: Inspect uploaded proofs and test Gemini AI proposal extractions.
   - **Payouts (`/payouts`)**: Review batch claims ready for PayPal disbursement.
   - **Cryptographic Ledger (`/ledger`)**: Click **"Verify Chain"** to execute the SHA-256 integrity audit across all historical transactions.
   - **Statements (`/statements`)**: View consistency streak heatmaps, timezone boundaries, and CSV exports.

### Option B: Running Locally

```bash
# 1. Clone repository
git clone https://github.com/Satyam2307/MicroSplit-AI.git
cd MicroSplit-AI

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env.local

# 4. Generate Prisma client
npx prisma generate

# 5. Run automated tests (63/63 passing)
npm test

# 6. Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🎯 1,000 USD Canonical Split Example

### Mathematical Breakdown
- **Total Pool**: **$1,000.00 USD** (`100,000` integer minor units / cents)
- **Consistency Bonus**: **5%**
- **Consistency Pool**: $\lfloor 100,000 \times 0.05 \rfloor =$ **$50.00** (`5,000` cents)
- **Work Pool**: $100,000 - 5,000 =$ **$950.00** (`95,000` cents)
- **Members**:
  - **Member 1 (Maya Chen)**: Equal work weight (50%), **100-day streak** (at cap)
  - **Member 2 (Sam Patel)**: Equal work weight (50%), **0-day streak**

### Payout Results
| Member | Work Share (95%) | Consistency Share (5%) | Final Payout Line | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **Maya Chen** | **$475.00** (`47,500¢`) | **$50.00** (`5,000¢`) | **$525.00** (`52,500¢`) | `Work 475.00 + Consistency 50.00 = 525.00 (100d streak, capped)` |
| **Sam Patel** | **$475.00** (`47,500¢`) | **$0.00** (`0¢`) | **$475.00** (`47,500¢`) | `Work 475.00 + Consistency 0.00 = 475.00 (0d streak)` |
| **Total** | **$950.00** (`95,000¢`) | **$50.00** (`5,000¢`) | **$1,000.00** (`100,000¢`) | **Exact match: 0 cents lost or created** |

---

## 🧪 Automated Test Suite

Run the test suite with Node's native test runner:
```bash
npm test
```

The **63 passing automated tests** verify:
1. **Canonical $1,000 Example**: Maya receives exactly $50.00 consistency share and Sam receives $0.00.
2. **Consistency Pool Bounds**: Consistency pool never exceeds declared percentage (max 10%).
3. **Streak Cap Invariant**: Member with streak above cap receives no more than member at cap.
4. **Freeze Day Preservation**: Freeze grants preserve streaks across missed days; missed unfrozen days reset streak to 0.
5. **Timezone Boundary**: Contribution at 23:30 local time counts for that local calendar day.
6. **Opt-Out Privacy Gate**: Members without opt-in are rejected with HTTP 403; zero session data is stored.
7. **10,000-Iteration Property Test**: 10,000 randomized pools, percentages, member counts, and streak sets assert $\sum \text{final} \equiv \text{pool}$ with zero cents lost or created.
8. **PayPal Client Security**: Sandbox boundary verification, sender ID lengths, response sanitization, and 403 NOT_AUTHORIZED diagnostics.
9. **Evidence & Gemini AI Workflow**: File MIME/size validation, proposal schema constraints, transient retry jitter, and exact identity matching.

---

## 🛠 Tech Stack
- **Framework**: Next.js 16.4.3 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4 + Vanilla CSS Design Tokens
- **Animations**: Framer Motion & GSAP
- **ORM & Data**: Prisma ORM with PostgreSQL contract (`prisma/schema.prisma`)
- **Crypto & Hashing**: Crypto-JS (SHA-256 hash chaining)
- **Payments**: PayPal Payouts v1 Batch Sandbox REST API
- **AI Models**: Google Gemini 3.8 Flash (`@google/genai`)

---

## 📄 License
This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
