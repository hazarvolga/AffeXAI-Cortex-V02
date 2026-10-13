"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { CircleCheck, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  fillTemplate,
  getPublicCopy,
  type PublicLocale,
} from "@/lib/i18n/public-copy";
import { ApiError } from "@/lib/api/http-client";
import { formsService } from "@/services/forms.service";
import { CONTACT_EMAIL, earlyAccessMailto } from "@/lib/marketing/contact";
import {
  EARLY_ACCESS_FIELD_ORDER,
  EARLY_ACCESS_LIMITS,
  EMPTY_EARLY_ACCESS_VALUES,
  isLikelyBot,
  newIdempotencyKey,
  payloadSignature,
  toSubmissionData,
  validateEarlyAccess,
  type EarlyAccessErrors,
  type EarlyAccessField,
  type EarlyAccessFormTarget,
  type EarlyAccessValues,
} from "@/lib/marketing/early-access";
import { FOCUS_RING, TEXT_LINK } from "./marketing-styles";

interface EarlyAccessFormProps {
  locale: PublicLocale;
  target: EarlyAccessFormTarget;
}

type Status = "idle" | "submitting" | "success" | "error" | "rateLimited";

const HTTP_TOO_MANY_REQUESTS = 429;

const INPUT = cn(
  "block w-full rounded-md border border-input bg-background px-3 py-2.5 text-base text-foreground",
  "placeholder:text-muted-foreground aria-[invalid=true]:border-destructive",
  FOCUS_RING,
);

const fieldId = (field: EarlyAccessField): string => `early-access-${field}`;

function withFieldError(
  errors: EarlyAccessErrors,
  field: EarlyAccessField,
  message: string | undefined,
): EarlyAccessErrors {
  const rest = Object.fromEntries(
    Object.entries(errors).filter(([key]) => key !== field),
  ) as EarlyAccessErrors;
  return message ? { ...rest, [field]: message } : rest;
}

export function EarlyAccessForm({ locale, target }: EarlyAccessFormProps) {
  const copy = getPublicCopy(locale).earlyAccess.form;
  const [values, setValues] = useState<EarlyAccessValues>(
    EMPTY_EARLY_ACCESS_VALUES,
  );
  const [errors, setErrors] = useState<EarlyAccessErrors>({});
  const [showSummary, setShowSummary] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const attempt = useRef<{ signature: string; key: string } | null>(null);
  const feedbackRef = useRef<HTMLHeadingElement>(null);

  const focusFeedback = () =>
    requestAnimationFrame(() => feedbackRef.current?.focus());

  const update = (field: keyof EarlyAccessValues, value: string) => {
    const next = { ...values, [field]: value };
    setValues(next);
    if (field !== "website" && errors[field]) {
      setErrors(
        withFieldError(
          errors,
          field,
          validateEarlyAccess(next, copy.errors)[field],
        ),
      );
    }
  };

  const validateOnBlur = (field: EarlyAccessField) => {
    setErrors(
      withFieldError(
        errors,
        field,
        validateEarlyAccess(values, copy.errors)[field],
      ),
    );
  };

  const idempotencyKeyFor = (data: Record<string, string>): string => {
    const signature = payloadSignature(data);
    if (attempt.current?.signature !== signature) {
      attempt.current = { signature, key: newIdempotencyKey() };
    }
    return attempt.current.key;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "submitting") return;

    const found = validateEarlyAccess(values, copy.errors);
    setErrors(found);
    const firstInvalid = EARLY_ACCESS_FIELD_ORDER.find((field) => found[field]);
    if (firstInvalid) {
      setShowSummary(true);
      document.getElementById(fieldId(firstInvalid))?.focus();
      return;
    }
    setShowSummary(false);

    if (isLikelyBot(values)) {
      setStatus("success");
      focusFeedback();
      return;
    }

    const data = toSubmissionData(values);
    setStatus("submitting");
    try {
      await formsService.submit(
        target.tenant,
        target.formId,
        data,
        idempotencyKeyFor(data),
      );
      setStatus("success");
    } catch (error) {
      const rateLimited =
        error instanceof ApiError && error.status === HTTP_TOO_MANY_REQUESTS;
      setStatus(rateLimited ? "rateLimited" : "error");
    }
    focusFeedback();
  };

  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded-md border border-border bg-card p-6 md:p-8"
      >
        <h3
          ref={feedbackRef}
          tabIndex={-1}
          className="flex items-center gap-3 text-xl font-semibold focus:outline-none"
        >
          <CircleCheck aria-hidden="true" className="h-6 w-6 text-success" />
          {copy.successTitle}
        </h3>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {copy.successBody}
        </p>
      </div>
    );
  }

  const errorCount = Object.keys(errors).length;
  const failed = status === "error" || status === "rateLimited";
  const describedBy = (field: EarlyAccessField, hint?: string) =>
    [hint, errors[field] ? `${fieldId(field)}-error` : undefined]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="relative space-y-6"
      aria-describedby="early-access-intro"
    >
      <p id="early-access-intro" className="text-sm text-muted-foreground">
        {copy.intro}
      </p>

      {showSummary && errorCount > 0 && (
        <p
          role="alert"
          className="rounded-md border border-destructive/60 px-4 py-3 text-sm text-foreground"
        >
          {fillTemplate(copy.errorSummary, { count: errorCount })}
        </p>
      )}

      {failed && (
        <div
          role="alert"
          className="rounded-md border border-destructive/60 bg-card p-4"
        >
          <h3
            ref={feedbackRef}
            tabIndex={-1}
            className="flex items-center gap-2 text-base font-semibold focus:outline-none"
          >
            <TriangleAlert aria-hidden="true" className="h-5 w-5" />
            {copy.errorTitle}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {status === "rateLimited" ? copy.rateLimited : copy.errorBody}{" "}
            <a href={earlyAccessMailto()} className={TEXT_LINK}>
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>
      )}

      <TextField
        field="contactName"
        label={copy.name}
        autoComplete="name"
        values={values}
        errors={errors}
        onChange={update}
        onBlur={validateOnBlur}
        describedBy={describedBy("contactName")}
      />
      <TextField
        field="email"
        label={copy.email}
        type="email"
        autoComplete="email"
        values={values}
        errors={errors}
        onChange={update}
        onBlur={validateOnBlur}
        describedBy={describedBy("email")}
      />
      <TextField
        field="companyName"
        label={copy.company}
        autoComplete="organization"
        values={values}
        errors={errors}
        onChange={update}
        onBlur={validateOnBlur}
        describedBy={describedBy("companyName")}
      />

      <div>
        <label
          htmlFor={fieldId("message")}
          className="block text-sm font-medium text-foreground"
        >
          {copy.message}{" "}
          <span className="font-normal text-muted-foreground">
            ({copy.optional})
          </span>
        </label>
        <p
          id={`${fieldId("message")}-hint`}
          className="mt-1 text-sm text-muted-foreground"
        >
          {copy.messageHint}
        </p>
        <textarea
          id={fieldId("message")}
          name="message"
          rows={5}
          maxLength={EARLY_ACCESS_LIMITS.message}
          value={values.message}
          onChange={(event) => update("message", event.target.value)}
          onBlur={() => validateOnBlur("message")}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={describedBy(
            "message",
            `${fieldId("message")}-hint`,
          )}
          className={cn(INPUT, "mt-2 min-h-32 resize-y")}
        />
        <FieldError field="message" errors={errors} />
      </div>

      {/* Honeypot: off-screen and out of the tab order; only bots fill it. */}
      <div
        aria-hidden="true"
        className="absolute -left-[10000px] h-px w-px overflow-hidden"
      >
        <label htmlFor="early-access-website">{copy.honeypot}</label>
        <input
          id="early-access-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(event) => update("website", event.target.value)}
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {copy.privacyNote}{" "}
        <Link href="/privacy" className={TEXT_LINK}>
          {copy.privacyLink}
        </Link>
      </p>

      <Button
        type="submit"
        size="lg"
        className="w-full text-base sm:w-auto"
        disabled={status === "submitting"}
        aria-disabled={status === "submitting"}
      >
        {status === "submitting" ? copy.submitting : copy.submit}
      </Button>
    </form>
  );
}

interface TextFieldProps {
  field: Exclude<EarlyAccessField, "message">;
  label: string;
  type?: "text" | "email";
  autoComplete: string;
  values: EarlyAccessValues;
  errors: EarlyAccessErrors;
  describedBy?: string;
  onChange: (field: EarlyAccessField, value: string) => void;
  onBlur: (field: EarlyAccessField) => void;
}

function TextField({
  field,
  label,
  type = "text",
  autoComplete,
  values,
  errors,
  describedBy,
  onChange,
  onBlur,
}: TextFieldProps) {
  return (
    <div>
      <label
        htmlFor={fieldId(field)}
        className="block text-sm font-medium text-foreground"
      >
        {label}
      </label>
      <input
        id={fieldId(field)}
        name={field}
        type={type}
        required
        autoComplete={autoComplete}
        maxLength={EARLY_ACCESS_LIMITS[field]}
        value={values[field]}
        onChange={(event) => onChange(field, event.target.value)}
        onBlur={() => onBlur(field)}
        aria-invalid={Boolean(errors[field])}
        aria-describedby={describedBy}
        className={cn(INPUT, "mt-2")}
      />
      <FieldError field={field} errors={errors} />
    </div>
  );
}

function FieldError({
  field,
  errors,
}: {
  field: EarlyAccessField;
  errors: EarlyAccessErrors;
}) {
  const message = errors[field];
  if (!message) return null;
  return (
    <p
      id={`${fieldId(field)}-error`}
      className="mt-2 flex items-start gap-1.5 text-sm text-foreground"
    >
      <TriangleAlert
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
      />
      {message}
    </p>
  );
}
