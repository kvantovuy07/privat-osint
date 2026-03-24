"use client";

import { useActionState } from "react";
import Link from "next/link";

import { loginAction, requestAccessAction } from "@/actions/auth";
import { useLocale } from "@/components/locale-provider";
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
  const { dictionary } = useLocale();

  return (
    <form action={formAction} className="grid gap-4">
      <Input label={dictionary.loginForm.login} name="username" required placeholder="Mentor" />
      <Input
        label={dictionary.loginForm.password}
        name="password"
        type="password"
        required
        placeholder="••••••••••"
      />
      <StatusMessage status={state.status} message={state.message} />
      <PendingButton
        label={dictionary.loginForm.enter}
        pendingLabel={dictionary.loginForm.authorizing}
        className="rounded-2xl bg-emerald-400 px-4 py-3 font-medium text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
      />
      <Link
        href="/request-access"
        className="text-center text-sm text-emerald-200/80 transition hover:text-emerald-100"
      >
        {dictionary.loginForm.requestAccess}
      </Link>
    </form>
  );
}

export function AccessRequestForm() {
  const [state, formAction] = useActionState(
    requestAccessAction,
    emptyActionState,
  );
  const { dictionary } = useLocale();

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label={dictionary.accessForm.name}
          name="name"
          required
          placeholder={dictionary.accessForm.namePlaceholder}
        />
        <Input
          label={dictionary.accessForm.requestedLogin}
          name="requestedUsername"
          required
          placeholder={dictionary.accessForm.loginPlaceholder}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label={dictionary.accessForm.email}
          name="email"
          type="email"
          required
          placeholder={dictionary.accessForm.emailPlaceholder}
        />
        <Input
          label={dictionary.accessForm.contact}
          name="contact"
          placeholder={dictionary.accessForm.contactPlaceholder}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label={dictionary.accessForm.company}
          name="company"
          placeholder={dictionary.accessForm.companyPlaceholder}
        />
        <Input
          label={dictionary.accessForm.reason}
          name="reason"
          required
          placeholder={dictionary.accessForm.reasonPlaceholder}
        />
      </div>
      <Input
        label={dictionary.accessForm.comment}
        name="comment"
        rows={4}
        placeholder={dictionary.accessForm.commentPlaceholder}
      />
      <StatusMessage status={state.status} message={state.message} />
      <PendingButton
        label={dictionary.accessForm.submit}
        pendingLabel={dictionary.accessForm.submitting}
        className="rounded-2xl bg-emerald-400 px-4 py-3 font-medium text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </form>
  );
}
