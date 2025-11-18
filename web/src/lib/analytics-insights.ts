import { ActionState } from "@/lib/action-state";

export type OptimizationInsightState = ActionState & {
  suggestions?: string[];
};

export const initialOptimizationInsightState: OptimizationInsightState = {
  status: "idle",
  suggestions: [],
};
