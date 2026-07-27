# Practice Lab — Superadmin Guide

Practice Lab helps employees rehearse workplace conversations with AI characters.
It does not grade conversations. Employees answer three reflection questions and
then receive conversational coaching with three suggestions for next time.

## Scenario management

Superadmins can open **Manage Scenarios** to:

1. Create a scenario and save it as a draft.
2. Define the employee role, AI character, opening message, background, and
   escalation/de-escalation behavior.
3. Test the scenario without creating an employee training record.
4. Publish it to the employee library.
5. Duplicate it to create a variation.
6. Select **Remove from Library** to archive it.

Removal is intentionally recoverable. It hides the scenario from employees while
preserving existing attempts. Open the archived scenario and publish it to restore it.

Administrators can create and edit scenarios. Permanent library removal is reserved
for the `SUPERADMIN` role.

## Assignments and team activity

Supervisors, administrators, and superadmins can assign published scenarios with an
optional due date. Team Activity reports completion only; it does not show grades,
scores, or pass/fail results.

## Settings

Administrators and superadmins can enable or disable Practice Lab and voice mode,
control supervisor transcript access, and set transcript-retention days.

## Production safety

- Store `OPENAI_API_KEY`, `AUTH_SECRET`, and database credentials as deployment secrets.
- Do not run the demo seed in production.
- Review transcript-retention and supervisor-access settings with your privacy owner.
- Protect the main branch and require the CI workflow before merge.
- Test scenario prompts before assigning them to employees.
