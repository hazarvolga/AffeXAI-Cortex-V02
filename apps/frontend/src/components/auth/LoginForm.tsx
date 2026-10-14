"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  LOGIN_COPY,
  loginFailureMessage,
  validateLogin,
  type LoginContext,
  type LoginField,
  type LoginValues,
} from "@/lib/auth/login-copy";
import {
  isTenantSelection,
  type WorkspaceChoice,
} from "@/lib/auth/login-outcome";
import { postLoginDestination } from "@/lib/auth/post-login-destination";
import { tenantFromPath } from "@/lib/auth/tenant-selection";
import { WorkspaceChooser } from "./WorkspaceChooser";

interface LoginFormProps {
  context: LoginContext;
}

type FieldErrors = Partial<Record<LoginField, string>>;

const FIELD_ORDER: readonly LoginField[] = ["email", "password", "workspace"];
const INPUT =
  "mt-2 block h-11 w-full rounded-md border border-input bg-background px-3 text-base text-foreground placeholder:text-muted-foreground aria-[invalid=true]:border-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const LINK =
  "font-medium text-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const fieldId = (field: LoginField) => `login-${field}`;

function withFieldError(
  errors: FieldErrors,
  field: LoginField,
  message?: string,
): FieldErrors {
  const rest = Object.fromEntries(
    Object.entries(errors).filter(([key]) => key !== field),
  ) as FieldErrors;
  return message ? { ...rest, [field]: message } : rest;
}

/**
 * The single sign-in form behind /login, /admin/login and /<tenant>/admin/login.
 * The workspace code is optional; on a tenant URL it is fixed by the path.
 */
export function LoginForm({ context }: LoginFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const routeTenant = tenantFromPath(pathname ?? "");

  const [values, setValues] = useState<LoginValues>({
    email: "",
    password: "",
    workspace: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [choices, setChoices] = useState<WorkspaceChoice[] | null>(null);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const failureRef = useRef<HTMLParagraphElement>(null);

  const update = (field: LoginField, value: string) => {
    const next = { ...values, [field]: value };
    setValues(next);
    if (errors[field])
      setErrors(withFieldError(errors, field, validateLogin(next)[field]));
  };

  const signIn = async (tenantId: string | undefined) => {
    setFailure(null);
    try {
      const outcome = await login({
        email: values.email.trim(),
        password: values.password,
        tenantId,
      });
      if (isTenantSelection(outcome)) {
        setChoices(outcome.tenants);
        return;
      }
      router.push(
        postLoginDestination(outcome.user, searchParams?.get("redirect")),
      );
    } catch (error) {
      setFailure(loginFailureMessage(error));
      requestAnimationFrame(() => failureRef.current?.focus());
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const found = validateLogin(values);
    setErrors(found);
    const firstInvalid = FIELD_ORDER.find((field) => found[field]);
    setShowSummary(Boolean(firstInvalid));
    if (firstInvalid) {
      document.getElementById(fieldId(firstInvalid))?.focus();
      return;
    }
    setSubmitting(true);
    await signIn(routeTenant ?? (values.workspace.trim() || undefined));
    setSubmitting(false);
  };

  const choose = async (slug: string) => {
    setBusySlug(slug);
    await signIn(slug);
    setBusySlug(null);
  };

  if (choices) {
    return (
      <>
        {failure && <FailureNotice message={failure} focusRef={failureRef} />}
        <WorkspaceChooser
          choices={choices}
          busySlug={busySlug}
          onChoose={choose}
          onBack={() => {
            setChoices(null);
            setFailure(null);
            setValues({ ...values, password: "" });
          }}
        />
      </>
    );
  }

  const describedBy = (field: LoginField, hint?: string) =>
    [hint, errors[field] ? `${fieldId(field)}-error` : undefined]
      .filter(Boolean)
      .join(" ") || undefined;
  const forgotHref =
    context === "team" ? "/admin/forgot-password" : "/forgot-password";

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-5">
      {failure && <FailureNotice message={failure} focusRef={failureRef} />}
      {showSummary && Object.keys(errors).length > 0 && (
        <p
          role="alert"
          className="rounded-md border border-destructive/50 px-3 py-2 text-sm"
        >
          {LOGIN_COPY.errorSummary.replace(
            "{count}",
            String(Object.keys(errors).length),
          )}
        </p>
      )}

      <Field field="email" label={LOGIN_COPY.email} errors={errors}>
        <input
          id={fieldId("email")}
          name="email"
          type="email"
          autoComplete="username"
          required
          value={values.email}
          onChange={(e) => update("email", e.target.value)}
          onBlur={() =>
            setErrors(
              withFieldError(errors, "email", validateLogin(values).email),
            )
          }
          aria-invalid={Boolean(errors.email)}
          aria-describedby={describedBy("email")}
          className={INPUT}
        />
      </Field>

      <Field field="password" label={LOGIN_COPY.password} errors={errors}>
        <input
          id={fieldId("password")}
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={values.password}
          onChange={(e) => update("password", e.target.value)}
          onBlur={() =>
            setErrors(
              withFieldError(
                errors,
                "password",
                validateLogin(values).password,
              ),
            )
          }
          aria-invalid={Boolean(errors.password)}
          aria-describedby={describedBy("password")}
          className={INPUT}
        />
      </Field>

      {routeTenant ? (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          {LOGIN_COPY.workspaceLocked}:{" "}
          <span className="font-mono text-foreground">{routeTenant}</span>
        </p>
      ) : showWorkspace ? (
        <Field
          field="workspace"
          label={LOGIN_COPY.workspace}
          optional
          errors={errors}
        >
          <p
            id="login-workspace-hint"
            className="mt-1 text-sm text-muted-foreground"
          >
            {LOGIN_COPY.workspaceHint}
          </p>
          <input
            id={fieldId("workspace")}
            name="workspace"
            type="text"
            autoComplete="organization"
            value={values.workspace}
            onChange={(e) => update("workspace", e.target.value)}
            onBlur={() =>
              setErrors(
                withFieldError(
                  errors,
                  "workspace",
                  validateLogin(values).workspace,
                ),
              )
            }
            aria-invalid={Boolean(errors.workspace)}
            aria-describedby={describedBy("workspace", "login-workspace-hint")}
            className={INPUT}
          />
        </Field>
      ) : (
        <Button
          type="button"
          variant="link"
          className="h-auto px-0 text-sm text-foreground underline"
          onClick={() => setShowWorkspace(true)}
        >
          {LOGIN_COPY.workspaceToggle}
        </Button>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full text-base"
        disabled={submitting}
        aria-disabled={submitting}
      >
        {submitting ? LOGIN_COPY.submitting : LOGIN_COPY.submit}
      </Button>

      <div className="flex flex-col gap-3 border-t border-border pt-5 text-sm sm:flex-row sm:justify-between">
        <Link href={forgotHref} className={LINK}>
          {LOGIN_COPY.forgotPassword}
        </Link>
        <p className="text-muted-foreground">
          {LOGIN_COPY.noAccount}{" "}
          <Link href="/erken-erisim" className={LINK}>
            {LOGIN_COPY.requestAccess}
          </Link>
        </p>
      </div>
    </form>
  );
}

interface FieldProps {
  field: LoginField;
  label: string;
  optional?: boolean;
  errors: FieldErrors;
  children: React.ReactNode;
}

function Field({
  field,
  label,
  optional = false,
  errors,
  children,
}: FieldProps) {
  return (
    <div>
      <label htmlFor={fieldId(field)} className="block text-sm font-medium">
        {label}
        {optional && (
          <span className="font-normal text-muted-foreground">
            {" "}
            ({LOGIN_COPY.workspaceOptional})
          </span>
        )}
      </label>
      {children}
      {errors[field] && (
        <p
          id={`${fieldId(field)}-error`}
          className="mt-2 flex items-start gap-1.5 text-sm"
        >
          <TriangleAlert
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
          />
          {errors[field]}
        </p>
      )}
    </div>
  );
}

function FailureNotice({
  message,
  focusRef,
}: {
  message: string;
  focusRef: React.RefObject<HTMLParagraphElement>;
}) {
  return (
    <p
      ref={focusRef}
      tabIndex={-1}
      role="alert"
      className="mb-5 flex items-start gap-2 rounded-md border border-destructive/50 px-3 py-3 text-sm focus:outline-none"
    >
      <TriangleAlert
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
      />
      {message}
    </p>
  );
}
