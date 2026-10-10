# ⚖️ Decision Matrix: In-Place Evolution vs. Clean Slate v2

**Context:** The user proposed initializing a new folder (`affexai-v02`) and database to build the new architecture from scratch, keeping the current system (`v1`) as a live reference/safety net.

## 🥊 The Comparison

| Feature | Option A: In-Place Evolution (SafetyNet) | Option B: Clean Slate v2 (Rewrite) |
| :--- | :--- | :--- |
| **Safety** | 🟡 **Medium:** Modifies live codebase. Relies on Git Tags + Parallel Folders. | 🟢 **High:** `v1` is physically untouched. Zero risk of breaking current production during dev. |
| **Data Continuity** | 🟢 **High:** Uses existing DB. Users/Tickets remain accessible throughout. | 🔴 **Low:** New DB starts empty. Requires massive **ETL Migration** (Export/Import) later. |
| **Development Speed** | 🟠 **Medium:** Must fix imports constantly. "Turning the ship while moving." | 🟢 **High:** Freedom to structure perfectly without legacy friction initially. |
| **Integration Pain** | 🟢 **Low:** Continuous integration. Bugs found daily. | 🔴 **Critical:** "The Big Bang." Merging v2 logic with v1 data at the end is often where projects die. |
| **Infrastructure** | 🟢 **Simple:** Same ports, same .env. | 🟠 **Complex:** Need port offset (9007 vs 9006), double docker containers. |

---

## 🕵️ Deep Dive: The Hidden Cost of Option B (v2)

Starting `affexai-v02` feels safer now, but it creates a **"Data Gravity"** problem.

1.  **The Code Gap:** While we build v2, v1 might get a hotfix. We must remember to apply it to v2 manually.
2.  **The Data Gap (The Killer):** 
    *   Day 1: v1 DB has 100 users. v2 DB has 0.
    *   Day 30: v1 DB has 200 users + 500 tickets. v2 is ready.
    *   **Migration Day:** You have to write a script to move those 200 users + 500 tickets into v2's *new* schema structure. This is often harder than the refactor itself.

## 🛡️ Recommendation: "The Strangler Fig Pattern" (Hybrid)

Instead of a separate `v2` folder, we use the **Parallel Module** strategy *inside* the existing repo. This gives the safety of v2 without the data migration nightmare.

**How it works:**
1.  **Keep v1 running:** Old `src/auth` and `src/modules` stay active.
2.  **Build v2 side-by-side:** Create `src/core` and `src/modules-v2`.
3.  **Route Switching:**
    *   Old Endpoint: `/api/v1/auth/login` -> serves from old code.
    *   New Endpoint: `/api/v2/auth/login` -> serves from new code.
4.  **Database:** Both share the same DB, so data is always live.

### ✅ Verdict
**Stick to Option A (In-Place with SafetyNet).**
Option B (Separate Folder) creates a "Integration Wall" in the future that is highly risky for a functional product with live data potential.

*However, if you feel extremely unsafe modifying v1, Option B is a valid "Panic Button" choice, provided you accept the future data migration cost.*
