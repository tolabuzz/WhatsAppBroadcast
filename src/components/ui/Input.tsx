import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from "react";

interface FieldWrapProps {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function FieldWrap({ label, hint, error, children }: FieldWrapProps) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-ink mb-1.5">{label}</span>}
      {children}
      {hint && !error && <span className="block text-xs text-ink-muted mt-1">{hint}</span>}
      {error && <span className="block text-xs text-danger mt-1">{error}</span>}
    </label>
  );
}

const baseInputClass =
  "w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent transition-shadow";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, className = "", ...props }: InputProps) {
  return (
    <FieldWrap label={label} hint={hint} error={error}>
      <input className={`${baseInputClass} ${error ? "ring-2 ring-danger/40" : ""} ${className}`} {...props} />
    </FieldWrap>
  );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function TextArea({ label, hint, error, className = "", ...props }: TextAreaProps) {
  return (
    <FieldWrap label={label} hint={hint} error={error}>
      <textarea className={`${baseInputClass} resize-none ${className}`} {...props} />
    </FieldWrap>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Select({ label, hint, error, className = "", children, ...props }: SelectProps) {
  return (
    <FieldWrap label={label} hint={hint} error={error}>
      <select className={`${baseInputClass} ${className}`} {...props}>
        {children}
      </select>
    </FieldWrap>
  );
}
