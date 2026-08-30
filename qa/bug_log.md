# Bug Log — Person E (Integration/QA/Deploy)

Log every bug found during integration/E2E testing here, not just in a
private chat — the organizer's judging criteria reward visible process.
One row per bug. Update status as it's fixed.

| # | Found in | Description | Severity | Status | Fixed by / commit |
|---|----------|--------------|----------|--------|--------------------|
| 1 | | | | Open | |

**Severity guide:** Blocker (breaks the core demo flow) / Major (breaks a required feature) / Minor (cosmetic, edge case).

**Status values:** Open → In Progress → Fixed → Verified.

---

## Known edge cases to test (see qa/personas/personas.json)
- [ ] Vague/underspecified goal text → follow-up question shown, not a silent bad guess
- [ ] Learner changes their goal mid-session → profile update reshapes next roadmap
- [ ] Advanced learner + tight timeline → no beginner filler content
- [ ] Goal outside all 3 catalog domains → empty state shown, not a hallucinated roadmap
- [ ] AI provider unreachable (all keys unset) → 422 + retry UI, not a raw stack trace
- [ ] Reload the roadmap dashboard mid-session with no prior state → still loads correctly from `GET /api/roadmap/{id}`
- [ ] Skip an item → replan triggers and the "what changed" banner reflects the skip, not generic text
