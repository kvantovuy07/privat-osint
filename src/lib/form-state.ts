export type ActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type SearchActionState<T> = ActionState & {
  result: T | null;
};

export const emptyActionState: ActionState = {
  status: "idle",
  message: "",
};
