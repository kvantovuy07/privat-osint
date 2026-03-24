"use client";

import { useFormStatus } from "react-dom";

type PendingButtonProps = {
  label: string;
  pendingLabel?: string;
  className?: string;
  type?: "submit" | "button";
  name?: string;
  value?: string;
};

export function PendingButton({
  label,
  pendingLabel,
  className,
  type = "submit",
  name,
  value,
}: PendingButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type={type}
      name={name}
      value={value}
      disabled={pending}
      className={className}
    >
      {pending ? pendingLabel || "Working..." : label}
    </button>
  );
}
