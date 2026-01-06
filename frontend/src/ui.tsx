// frontend/src/ui.tsx
import type { CSSProperties, ReactNode } from "react";

type BaseProps = {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

const styles = {
  container: {
    maxWidth: 980,
    margin: "0 auto",
    padding: 16,
  } as CSSProperties,

  card: {
    border: "1px solid #e6e6e6",
    borderRadius: 14,
    padding: 14,
    background: "#fff",
  } as CSSProperties,

  muted: {
    color: "rgba(0,0,0,0.65)",
    fontSize: 14,
    lineHeight: 1.35,
  } as CSSProperties,

  h1: {
    margin: "0 0 8px 0",
    fontSize: 28,
    letterSpacing: -0.2,
  } as CSSProperties,

  h2: {
    margin: "0 0 8px 0",
    fontSize: 20,
    letterSpacing: -0.1,
  } as CSSProperties,

  row: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  } as CSSProperties,

  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid #e6e6e6",
    background: "#fafafa",
  } as CSSProperties,

  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #dadada",
    outline: "none",
    fontSize: 14,
  } as CSSProperties,

  button: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    cursor: "pointer",
    fontSize: 14,
  } as CSSProperties,

  buttonSecondary: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #dadada",
    background: "#fff",
    color: "#111",
    cursor: "pointer",
    fontSize: 14,
  } as CSSProperties,

  divider: {
    height: 1,
    background: "#eee",
    border: "none",
    margin: "16px 0",
  } as CSSProperties,
};

function cx(a?: string, b?: string) {
  return [a, b].filter(Boolean).join(" ");
}

export function Container({ children, className, style }: BaseProps) {
  return (
    <div className={className} style={{ ...styles.container, ...style }}>
      {children}
    </div>
  );
}

export function Card({ children, className, style }: BaseProps) {
  return (
    <div className={className} style={{ ...styles.card, ...style }}>
      {children}
    </div>
  );
}

export function Muted({ children, className, style }: BaseProps) {
  return (
    <div className={className} style={{ ...styles.muted, ...style }}>
      {children}
    </div>
  );
}

export function H1({ children, className, style }: BaseProps) {
  return (
    <h1 className={className} style={{ ...styles.h1, ...style }}>
      {children}
    </h1>
  );
}

export function H2({ children, className, style }: BaseProps) {
  return (
    <h2 className={className} style={{ ...styles.h2, ...style }}>
      {children}
    </h2>
  );
}

export function Row({
  children,
  className,
  style,
  wrap = false,
}: BaseProps & { wrap?: boolean }) {
  return (
    <div
      className={className}
      style={{
        ...styles.row,
        ...(wrap ? { flexWrap: "wrap" as const } : null),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Divider({ className, style }: { className?: string; style?: CSSProperties }) {
  return <hr className={className} style={{ ...styles.divider, ...style }} />;
}

export function Badge({
  children,
  className,
  style,
  tone = "neutral",
}: BaseProps & { tone?: "neutral" | "success" | "warn" | "danger" }) {
  const toneStyle: Record<string, CSSProperties> = {
    neutral: { background: "#fafafa", borderColor: "#e6e6e6", color: "#111" },
    success: { background: "#f2fbf4", borderColor: "#bfe9c8", color: "#0b6b2a" },
    warn: { background: "#fff7ed", borderColor: "#fed7aa", color: "#9a3412" },
    danger: { background: "#fff1f2", borderColor: "#fecdd3", color: "#9f1239" },
  };

  return (
    <span className={className} style={{ ...styles.badge, ...toneStyle[tone], ...style }}>
      {children}
    </span>
  );
}

export function Input(
  props: React.InputHTMLAttributes<HTMLInputElement> & { style?: CSSProperties }
) {
  const { style, ...rest } = props;
  return <input {...rest} style={{ ...styles.input, ...style }} />;
}

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary";
    style?: CSSProperties;
  }
) {
  const { variant = "primary", style, ...rest } = props;
  const base = variant === "primary" ? styles.button : styles.buttonSecondary;
  return <button {...rest} style={{ ...base, ...style }} />;
}

export function A({
  href,
  children,
  className,
  style,
}: { href: string; children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <a
      href={href}
      className={className}
      style={cx(undefined, className) ? style : style}
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  );
}
