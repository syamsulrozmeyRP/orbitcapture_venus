export type ActionStatus = "idle" | "success" | "error";

export type ActionState = {
  status: ActionStatus;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialActionState: ActionState = { status: "idle" };
