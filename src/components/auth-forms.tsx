"use client";

import { useActionState } from "react";
import Link from "next/link";

import { loginAction, requestAccessAction } from "@/actions/auth";
import { PendingButton } from "@/components/pending-button";
import { emptyActionState } from "@/lib/form-state";

function StatusMessage({
  status,
  message,
}: {
  status: "idle" | "success" | "error";
  message: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <p
      className={`rounded-2xl border px-4 py-3 text-sm ${
        status === "error"
          ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
      }`}
    >
      {message}
    </p>
  );
}

function Input({
  label,
  name,
  type = "text",
  placeholder,
  required,
  rows,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}) {
  return (
    <label className="grid gap-2 text-sm text-zinc-300">
      <span>{label}</span>
      {rows ? (
        <textarea
          name={name}
          rows={rows}
          required={required}
          placeholder={placeholder}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-emerald-400/60 focus:bg-white/7"
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-emerald-400/60 focus:bg-white/7"
        />
      )}
    </label>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, emptyActionState);

  return (
    <form action={formAction} className="grid gap-4">
      <Input label="Login" name="username" required placeholder="Mentor" />
      <Input
        label="Password"
        name="password"
        type="password"
        required
        placeholder="••••••••••"
      />
      <StatusMessage status={state.status} message={state.message} />
      <PendingButton
        label="Enter Console"
        pendingLabel="Authorizing..."
        className="rounded-2xl bg-emerald-400 px-4 py-3 font-medium text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
      />
      <Link
        href="/request-access"
        className="text-center text-sm text-emerald-200/80 transition hover:text-emerald-100"
      >
        Подать заявку на доступ
      </Link>
    </form>
  );
}

export function AccessRequestForm() {
  const [state, formAction] = useActionState(
    requestAccessAction,
    emptyActionState,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Name" name="name" required placeholder="Name or alias" />
        <Input
          label="Requested login"
          name="requestedUsername"
          required
          placeholder="future username"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Email" name="email" type="email" required placeholder="name@company.com" />
        <Input label="Telegram / contact" name="contact" placeholder="@handle or contact" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Company / project" name="company" placeholder="Optional" />
        <Input label="Reason" name="reason" required placeholder="Why access is needed" />
      </div>
      <Input
        label="Comment"
        name="comment"
        rows={4}
        placeholder="Scope, expected usage, and any extra context"
      />
      <StatusMessage status={state.status} message={state.message} />
      <PendingButton
        label="Submit Access Request"
        pendingLabel="Submitting..."
        className="rounded-2xl bg-emerald-400 px-4 py-3 font-medium text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </form>
  );
}
