import type { ReactNode } from "react";

interface InputProps {
  id: string;
  name: string;
  type?: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
  disabled?: boolean;
  required?: boolean;
}

export function Input({
  id,
  name,
  type = "text",
  label,
  placeholder,
  value,
  onChange,
  error,
  autoComplete,
  disabled = false,
  required = false,
}: InputProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-ink-muted mb-2"
      >
        {label}
        {required && <span className="text-primary ml-1">*</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        required={required}
        className={`
          w-full h-12 px-4 rounded-md
          bg-surface-1 border border-hairline
          text-ink placeholder:text-ink-tertiary
          transition-colors
          focus:outline-none focus:border-primary-focus focus:ring-2 focus:ring-primary-focus/50
          disabled:cursor-not-allowed disabled:opacity-50
          ${error ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/50" : ""}
        `}
      />
      {error && (
        <p className="mt-2 text-sm text-rose-400" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

interface TextAreaProps {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  rows?: number;
  disabled?: boolean;
  required?: boolean;
}

export function TextArea({
  id,
  name,
  label,
  placeholder,
  value,
  onChange,
  error,
  rows = 4,
  disabled = false,
  required = false,
}: TextAreaProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-ink-muted mb-2"
      >
        {label}
        {required && <span className="text-primary ml-1">*</span>}
      </label>
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        required={required}
        className={`
          w-full px-4 py-3 rounded-md
          bg-surface-1 border border-hairline
          text-ink placeholder:text-ink-tertiary
          transition-colors resize-none
          focus:outline-none focus:border-primary-focus focus:ring-2 focus:ring-primary-focus/50
          disabled:cursor-not-allowed disabled:opacity-50
          ${error ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/50" : ""}
        `}
      />
      {error && (
        <p className="mt-2 text-sm text-rose-400" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

interface FormMessageProps {
  type?: "error" | "success" | "info";
  children: ReactNode;
}

export function FormMessage({ type = "info", children }: FormMessageProps) {
  const styles = {
    error: "border-rose-500/50 bg-rose-500/10 text-rose-400",
    success: "border-semantic-success/50 bg-semantic-success/10 text-semantic-success",
    info: "border-hairline-strong bg-surface-2 text-ink-muted",
  };

  return (
    <div
      className={`p-4 rounded-md border ${styles[type]}`}
      role="status"
      aria-live="polite"
    >
      {children}
    </div>
  );
}

interface FormGroupProps {
  children: ReactNode;
  className?: string;
}

export function FormGroup({ children, className = "" }: FormGroupProps) {
  return <div className={`space-y-5 ${className}`}>{children}</div>;
}