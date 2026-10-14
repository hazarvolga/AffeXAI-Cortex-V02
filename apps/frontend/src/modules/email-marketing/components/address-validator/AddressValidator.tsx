"use client";

import { useId, useState, type FormEvent } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { httpClient } from "@/lib/api/http-client";
import {
  describeValidation,
  type AddressValidationResult,
} from "./validation-view";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Checks one address with the backend's real checks (syntax, domain, MX,
 * disposable, role account, typo, reputation) and explains each result.
 */
export function AddressValidator() {
  const inputId = useId();
  const [email, setEmail] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<AddressValidationResult | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  const check = async (event: FormEvent) => {
    event.preventDefault();
    const value = email.trim();
    if (!EMAIL_PATTERN.test(value)) {
      setInputError("Örneğin ad@kurulus.com gibi bir e-posta adresi girin.");
      return;
    }
    setInputError(null);
    setRequestError(null);
    setChecking(true);
    try {
      const params = new URLSearchParams({ email: value });
      setResult(
        await httpClient.getWrapped<AddressValidationResult>(
          `/email-marketing/subscribers/validate-email?${params}`,
        ),
      );
    } catch {
      setResult(null);
      setRequestError("Doğrulama şu anda yapılamadı. Tekrar deneyin.");
    } finally {
      setChecking(false);
    }
  };

  const view = result ? describeValidation(result) : null;

  return (
    <div className="max-w-2xl space-y-6">
      <form onSubmit={check} noValidate className="space-y-3">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-white"
        >
          Doğrulanacak e-posta adresi
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id={inputId}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(inputError)}
            aria-describedby={inputError ? `${inputId}-error` : undefined}
            autoComplete="off"
          />
          <Button type="submit" disabled={checking}>
            {checking ? "Doğrulanıyor…" : "Doğrula"}
          </Button>
        </div>
        {inputError && (
          <p id={`${inputId}-error`} className="text-sm text-red-300">
            {inputError}
          </p>
        )}
      </form>

      <div aria-live="polite">
        {requestError && (
          <p role="alert" className="text-sm text-red-300">
            {requestError}
          </p>
        )}
        {result && view && (
          <section
            aria-label="Doğrulama sonucu"
            className="space-y-4 border border-white/15 p-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="break-all text-base font-semibold text-white">
                {result.email}
              </p>
              <p className="text-sm text-white/80">
                {view.statusLabel} · güven %{Math.round(result.confidence)}
              </p>
            </div>
            {view.suggestion && (
              <p className="text-sm text-white/85">
                Bunu mu demek istediniz:{" "}
                <button
                  type="button"
                  className="underline"
                  onClick={() => setEmail(view.suggestion ?? "")}
                >
                  {view.suggestion}
                </button>
              </p>
            )}
            {view.checks.length > 0 ? (
              <ul className="space-y-2">
                {view.checks.map((item) => (
                  <li key={item.key} className="flex items-start gap-2 text-sm">
                    {item.passed ? (
                      <CheckCircle2
                        aria-hidden
                        className="mt-0.5 h-4 w-4 shrink-0 text-green-400"
                      />
                    ) : (
                      <XCircle
                        aria-hidden
                        className="mt-0.5 h-4 w-4 shrink-0 text-red-300"
                      />
                    )}
                    <span className="text-white/85">
                      <span className="font-medium text-white">
                        {item.label}
                      </span>
                      <span className="sr-only">
                        {item.passed ? ": geçti" : ": geçmedi"}
                      </span>{" "}
                      — {item.details}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-white/75">
                {result.error
                  ? "Kontroller tamamlanamadı."
                  : "Ayrıntılı kontrol sonucu dönmedi."}
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
