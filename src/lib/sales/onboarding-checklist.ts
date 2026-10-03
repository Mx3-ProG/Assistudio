/**
 * The start-up checklist ("Goal: your first recommendation") shown over the
 * six onboarding steps (understand → sector → what to say → link & code →
 * message → prospect). Item i is done once the ambassador moved past the
 * onboarding step CHECKLIST_LAST_STEP[i].
 */
export const CHECKLIST_LAST_STEP = [0, 2, 3, 4, 5] as const;
export const CHECKLIST_SIZE = CHECKLIST_LAST_STEP.length;

export function checklistDone(step: number, completed = false): number {
  return completed ? CHECKLIST_SIZE : CHECKLIST_LAST_STEP.filter((last) => step > last).length;
}
