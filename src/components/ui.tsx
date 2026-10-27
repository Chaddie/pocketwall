"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useId } from "react";

export function PageHeader({
  kicker,
  title,
  subtitle,
  onRefresh,
  busy,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  busy?: boolean;
}) {
  return (
    <header className="page-head">
      <div>
        {kicker ? <p className="kicker">{kicker}</p> : null}
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {onRefresh ? (
        <button className="icon-btn" type="button" onClick={onRefresh} aria-label="Refresh" disabled={busy}>
          <RefreshCw size={18} />
        </button>
      ) : null}
    </header>
  );
}

export function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  spellCheck = false,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  spellCheck?: boolean;
  inputMode?: "numeric" | "text" | "decimal" | "tel" | "search" | "email" | "url" | "none";
}) {
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        spellCheck={spellCheck}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="toggle">
      <span>{label}</span>
      <button className={checked ? "switch on" : "switch"} type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}>
        <i />
      </button>
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div>
      <div className="label" style={{ marginBottom: 8 }}>{label}</div>
      <div className="segmented" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <button key={option.value} type="button" className={option.value === value ? "on" : ""} onClick={() => onChange(option.value)} aria-pressed={option.value === value}>
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Banner({ tone = "info", children }: { tone?: "info" | "warn" | "bad"; children: React.ReactNode }) {
  return <div className={tone === "info" ? "banner" : `banner ${tone}`}>{children}</div>;
}

export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="card empty">
      <strong>{title}</strong>
      <p className="small">{body}</p>
    </div>
  );
}

export function Skeletons({ count = 4 }: { count?: number }) {
  return (
    <div className="stack">
      {Array.from({ length: count }, (_, index) => <div className="skeleton" key={index} />)}
    </div>
  );
}

export function Sheet({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="sheet-back" onClick={onClose} role="presentation">
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <div className="grab" />
        <div className="spread" style={{ marginBottom: 10 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>{title}</h2>
          <button className="btn ghost" type="button" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function NameList({
  label,
  names,
  selected,
  any,
  onAny,
  onToggle,
}: {
  label: string;
  names: string[];
  selected: string[];
  any: boolean;
  onAny: (any: boolean) => void;
  onToggle: (name: string) => void;
}) {
  return (
    <div className="stack">
      <div className="spread">
        <span className="label">{label}</span>
        <button className={any ? "chip on" : "chip"} type="button" onClick={() => onAny(!any)}>Any</button>
      </div>
      {!any ? (
        <div className="picker">
          {names.length === 0 ? <p className="small muted">Nothing loaded yet. You can still save with Any, or add the name in Advanced JSON.</p> : null}
          {names.map((name) => (
            <label key={name}>
              <input type="checkbox" checked={selected.includes(name)} onChange={() => onToggle(name)} />
              <span>{name}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
