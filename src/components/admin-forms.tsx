"use client";

import { useActionState } from "react";
import type { AccessRequest, Role, User } from "@prisma/client";

import {
  createUserAction,
  reviewAccessRequestAction,
  updateUserAction,
} from "@/actions/admin";
import { useLocale } from "@/components/locale-provider";
import { PendingButton } from "@/components/pending-button";
import { emptyActionState } from "@/lib/form-state";

function stateClass(status: "idle" | "success" | "error") {
  if (status === "error") {
    return "border-rose-500/30 bg-rose-500/10 text-rose-200";
  }

  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-100";
}

function FormNote({
  status,
  message,
}: {
  status: "idle" | "success" | "error";
  message: string;
}) {
  if (!message) {
    return null;
  }

  return <p className={`rounded-xl border px-3 py-2 text-sm ${stateClass(status)}`}>{message}</p>;
}

function Input({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm text-zinc-300">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none transition focus:border-emerald-400/50"
      />
    </label>
  );
}

function RoleSelect({
  defaultValue,
  name = "role",
  label,
}: {
  defaultValue?: Role;
  name?: string;
  label: string;
}) {
  return (
    <label className="grid gap-2 text-sm text-zinc-300">
      <span>{label}</span>
      <select
        name={name}
        defaultValue={defaultValue || "VIEWER"}
        className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none transition focus:border-emerald-400/50"
      >
        <option value="ADMIN">ADMIN</option>
        <option value="ANALYST">ANALYST</option>
        <option value="VIEWER">VIEWER</option>
      </select>
    </label>
  );
}

export function CreateUserForm() {
  const [state, formAction] = useActionState(createUserAction, emptyActionState);
  const { dictionary } = useLocale();

  return (
    <form action={formAction} className="panel grid gap-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-white">{dictionary.adminForms.createTitle}</h2>
        <p className="text-sm text-zinc-400">
          {dictionary.adminForms.createDescription}
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Input label={dictionary.adminForms.username} name="username" placeholder="new-user" />
        <Input
          label={dictionary.adminForms.password}
          name="password"
          type="password"
          placeholder={dictionary.adminForms.temporaryPassword}
        />
        <Input
          label={dictionary.adminForms.name}
          name="name"
          placeholder={dictionary.adminForms.displayName}
        />
        <Input
          label={dictionary.adminForms.email}
          name="email"
          type="email"
          placeholder={dictionary.adminForms.optionalEmail}
        />
        <RoleSelect label={dictionary.adminForms.role} />
        <Input label={dictionary.adminForms.accessExpires} name="accessExpiresAt" type="date" />
        <Input
          label={dictionary.adminForms.totalQueryLimit}
          name="queryLimitTotal"
          type="number"
          placeholder={dictionary.adminForms.unlimitedIfBlank}
        />
        <Input
          label={dictionary.adminForms.monthlyQueryLimit}
          name="queryLimitMonthly"
          type="number"
          placeholder={dictionary.adminForms.unlimitedIfBlank}
        />
      </div>
      <FormNote status={state.status} message={state.message} />
      <PendingButton
        label={dictionary.adminForms.createUser}
        pendingLabel={dictionary.adminForms.creating}
        className="rounded-xl bg-emerald-400 px-4 py-3 font-medium text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </form>
  );
}

export function ReviewRequestForm({
  request,
}: {
  request: AccessRequest;
}) {
  const { dictionary } = useLocale();
  const [state, formAction] = useActionState(
    reviewAccessRequestAction,
    emptyActionState,
  );

  return (
    <form action={formAction} className="grid gap-3 rounded-2xl border border-white/10 bg-black/25 p-4">
      <input type="hidden" name="accessRequestId" value={request.id} />
      <div className="grid gap-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-white">{request.name}</h3>
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-amber-200">
            {request.status}
          </span>
        </div>
        <p className="text-sm text-zinc-400">
          {request.requestedUsername} • {request.email}
          {request.company ? ` • ${request.company}` : ""}
        </p>
      </div>
      <p className="text-sm text-zinc-300">{request.reason}</p>
      {request.comment ? <p className="text-sm text-zinc-400">{request.comment}</p> : null}
      <div className="grid gap-3 md:grid-cols-2">
        <Input
          label={dictionary.adminForms.approveAsUsername}
          name="username"
          defaultValue={request.requestedUsername}
        />
        <Input
          label={dictionary.adminForms.password}
          name="password"
          type="password"
          placeholder={dictionary.adminForms.requiredForApproval}
        />
        <RoleSelect defaultValue="VIEWER" label={dictionary.adminForms.role} />
        <Input label={dictionary.adminForms.accessExpires} name="accessExpiresAt" type="date" />
        <Input label={dictionary.adminForms.totalQueryLimit} name="queryLimitTotal" type="number" />
        <Input
          label={dictionary.adminForms.monthlyQueryLimit}
          name="queryLimitMonthly"
          type="number"
        />
      </div>
      <label className="grid gap-2 text-sm text-zinc-300">
        <span>{dictionary.adminForms.reviewNote}</span>
        <textarea
          name="reviewNote"
          rows={3}
          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none transition focus:border-emerald-400/50"
          placeholder={dictionary.adminForms.reviewNotePlaceholder}
        />
      </label>
      <FormNote status={state.status} message={state.message} />
      <div className="flex flex-wrap gap-3">
        <PendingButton
          label={dictionary.adminForms.approveAndCreate}
          pendingLabel={dictionary.adminForms.applying}
          name="decision"
          value="APPROVE"
          className="rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-medium text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <PendingButton
          label={dictionary.adminForms.reject}
          pendingLabel={dictionary.adminForms.applying}
          name="decision"
          value="REJECT"
          className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>
    </form>
  );
}

export function UpdateUserForm({
  user,
}: {
  user: User;
}) {
  const [state, formAction] = useActionState(updateUserAction, emptyActionState);
  const { dictionary } = useLocale();

  return (
    <form action={formAction} className="grid gap-3 rounded-2xl border border-white/10 bg-black/25 p-4">
      <input type="hidden" name="userId" value={user.id} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-white">{user.username}</h3>
          <p className="text-sm text-zinc-400">
            {user.email || dictionary.adminForms.noEmail} • {user.role}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={user.isActive}
            className="h-4 w-4 rounded border-white/10 bg-transparent accent-emerald-400"
          />
          {dictionary.common.active}
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Input label={dictionary.adminForms.name} name="name" defaultValue={user.name} />
        <Input
          label={dictionary.adminForms.email}
          name="email"
          type="email"
          defaultValue={user.email}
        />
        <RoleSelect defaultValue={user.role} label={dictionary.adminForms.role} />
        <Input
          label={dictionary.adminForms.accessExpires}
          name="accessExpiresAt"
          type="date"
          defaultValue={user.accessExpiresAt?.toISOString().slice(0, 10)}
        />
        <Input
          label={dictionary.adminForms.totalQueryLimit}
          name="queryLimitTotal"
          type="number"
          defaultValue={user.queryLimitTotal}
        />
        <Input
          label={dictionary.adminForms.monthlyQueryLimit}
          name="queryLimitMonthly"
          type="number"
          defaultValue={user.queryLimitMonthly}
        />
      </div>
      <Input
        label={dictionary.adminForms.password}
        name="password"
        type="password"
        placeholder={dictionary.adminForms.keepCurrentPassword}
      />
      <FormNote status={state.status} message={state.message} />
      <PendingButton
        label={dictionary.adminForms.saveChanges}
        pendingLabel={dictionary.adminForms.saving}
        className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </form>
  );
}
