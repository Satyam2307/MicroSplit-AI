# MicroSplit AI

> **Revenue orchestration & batch payouts for creator squads, open-source teams, and agencies.**
> Built with Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion, Prisma + PostgreSQL, and the PayPal Payouts v1 batch API.

---

## ⚡ What Changed

### 1. Feature A: Consistency Streak Bonus
- **Squad Rule Configuration**: Added `consistency_percent` (default 5%, max 10%), `streak_cap_days` (default 100), and `freeze_days_per_30` (default 2).
- **Deterministic Day Counting**: A day counts for a member if they have at least one **approved** contribution dated that day in the member's declared IANA timezone (`member.timezone`).
- **Streak Logic**: Consecutive counting days ending at the period end date. A missed day resets the streak, unless covered by an authorized freeze grant. Freeze grants are granted by approvers with a documented reason and sealed onto the SHA-256 ledger.
- **Deterministic Split Engine**:
  1. `consistency_pool = floor(pool * consistency_percent / 100)`
  2. `work_pool = pool - consistency_pool`
  3. `work_share[i]` allocated from weighted-points / share rules applied to `work_pool`.
  4. `capped_score[i] = min(streak_days[i], streak_cap_days)`.
  5. `consistency_share[i]` allocated proportionally to `capped_score` using largest-remainder rounding with stable tie-break on member ID. (If all capped scores are 0, consistency pool reverts to work pool so no minor units are lost).
  6. `final[i] = work_share[i] + consistency_share[i]`.
- **Split Line Storage**: `split_lines` stores `work_amount_minor`, `consistency_amount_minor`, `streak_days`, and `freeze_days_used`.
- **UI Two-Part Breakdown**: Displayed throughout the UI as:
  `"Work 950.00 + Consistency 50.00 = 1,000.00"`

### 2. Feature B: Focus Sessions (Opt-In Privacy First)
- **Strict Opt-In**: Members explicitly opt in via settings. Stored data is strictly minimal: `member_id`, `task_id`, `started_at`, `ended_at`, `source` (`"manual"` | `"linked_evidence"`), and optional `evidence_id`.
- **Zero Invasiveness**: Never captures keystrokes, screenshots, window titles, or background activity.
- **Member Sovereignty**: Members can view and permanently delete their session records anytime (`DELETE /api/focus-sessions/:id`).
- **Overlap Prevention**: Members cannot start overlapping focus sessions.
- **Approver Review Gating**: Sessions are evidence, not pay. Sessions exceeding 16 hours in a single calendar day or overlapping are automatically flagged as conflicts for human approver adjudication. Approved sessions enter the verified evidence trail, not directly altering dollar amounts.

---

## 🎯 1,000 USD Split Example & Demo Script

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

### Step-by-Step Demo Walkthrough
1. **Interactive Demo Run**:
   - Open **`http://localhost:3000/runs/run_3`** in your browser.
   - Inspect Maya Chen's split line: `"Work 475.00 + Consistency 50.00 = 525.00"`.
   - Inspect Sam Patel's split line: `"Work 475.00 + Consistency 0.00 = 475.00"`.
2. **Split Creator Simulation**:
   - Navigate to **`http://localhost:3000/splits/new`**.
   - Click **"Load $1,000 Canonical Example"**.
   - Toggle the **Consistency Streak Bonus** slider between 0% and 10% to observe the real-time deterministic reallocation.
3. **Streak Heatmap & Focus Sessions**:
   - Navigate to **`http://localhost:3000/statements`**.
   - View Maya's 100-day verified activity heatmap, timezone designation, and freeze days used.
   - Use the **Focus Session Widget** to start and stop a timer, toggle privacy opt-in, or delete session records.
4. **Approver Conflict Review**:
   - Navigate to **`http://localhost:3000/evidence`** and click the **"Focus Sessions"** tab.
   - Review flagged conflicts (e.g. >16h daily threshold) and approve them into the audit evidence trail.
5. **Ledger Verification**:
   - Navigate to **`http://localhost:3000/ledger`** and click **"Verify Chain"**.
   - Verify SHA-256 chain integrity across all events, including `freeze_granted` and `consistency_pool_allocated`.

---

## 🧪 Automated Test Suite

Run the test suite:
```bash
npm test
```
The suite runs via Node 26's native test runner with zero extra dependencies and verifies:
1. **Canonical $1,000 Example**: Maya receives exactly $50.00 consistency share and Sam receives $0.00.
2. **Consistency Pool Bounds**: Consistency pool never exceeds declared percentage (max 10%).
3. **Streak Cap Invariant**: Member with streak above cap receives no more than member at cap.
4. **Freeze Day Preservation**: Freeze grants preserve streaks across missed days; missed unfrozen days reset streak to 0.
5. **Timezone Boundary**: Contribution at 23:30 local time counts for that local calendar day.
6. **Opt-Out Privacy Gate**: Members without opt-in are rejected with HTTP 403; zero session data is stored.
7. **10,000-Iteration Property Test**: 10,000 randomized pools, percentages, member counts, and streak sets assert $\sum \text{final} \equiv \text{pool}$ with zero cents lost or created.

---

## 🛠 Tech Stack
- **Framework**: Next.js 16.4.3 (Turbopack, Partial Prerendering)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4 + Vanilla CSS Design Tokens
- **Animations**: Framer Motion
- **ORM & Data**: Prisma ORM with PostgreSQL contract (`prisma/schema.prisma`)
- **Crypto & Hashing**: Crypto-JS (SHA-256 hash chaining)
- **Payments**: PayPal Payouts v1 Batch Sandbox API
