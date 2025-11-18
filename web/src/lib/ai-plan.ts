import { ActionState } from "@/lib/action-state";

export type PlanResponse = ActionState & {
  headline?: string;
  outline?: string;
  ideas?: string[];
};

export const initialPlanState: PlanResponse = {
  status: "idle",
};

