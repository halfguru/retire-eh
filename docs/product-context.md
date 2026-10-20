# Product Context

This document captures the real-world motivation behind Retire, Eh? so that future
changes stay aligned with what the app is actually for. It is not a formal spec.

## The personal problem

The maintainer and their partner have a long-running disagreement about money:

- **Maintainer's view:** save deliberately, calculate what retirement requires, and
  define clear goals. Spending is fine as long as the saving goals are met.
- **Partner's view:** more short-term and spending-oriented; retirement feels abstract.

The goal is not to "win" the argument. It is to give both partners a shared, neutral
picture of the numbers so they can agree on **how much to save each year** to hit
their goals.

## What the tool needs to do

1. Make the required saving amount unmistakable.
   - The headline should be the **additional $/year needed** to reach the goal.
   - Show the gap clearly, in both pre-tax and after-tax terms.
2. Make the tradeoff concrete.
   - Saving more today versus spending today should be easy to compare.
   - Framing should be neutral and household-oriented, not judgmental.
3. Model their real situation.
   - Two people (maintainer + partner) in one household.
   - Partner's federal government pension (defined benefit) counted as guaranteed
     retirement income.
   - CPP and OAS included.
   - **Planned gifts** reserved for future large family expenses (e.g., helping kids
     with a down payment or a car).
4. Stay private and instant.
   - All calculations run client-side in pure TypeScript; no data leaves the browser.

## Features that already support this

- Multiple people per household, each with their own accounts, income, and pension.
- Per-person `annualIncome` and `annualPension` inputs.
- CPP and OAS estimates in the retirement income breakdown.
- Planned gifts, reserved from the retirement portfolio and reflected in the
  sustainable withdrawal and goal math.
- Goal progress with required portfolio, gap, and additional annual savings
  (pre-tax and after-tax).
- Pure TypeScript engine (`frontend/src/lib/engine.ts`,
  `frontend/src/lib/projectionSim.ts`, `frontend/src/lib/calculations.ts`).

## Candidate next steps

- Promote the "save an additional $X/year" result to the clearest headline in the UI.
- Add a side-by-side scenario view: current saving vs. goal-meeting saving, so the
  impact of spending today is explicit.
- Add a neutral "household agreement" summary that both partners can review together.

## Tone guidance

Use plain, neutral language. Avoid blame, lectures, or "you should" phrasing. The app
should inform a shared decision, not advocate for one partner's position.
