import React from "react";

type Tone = "neutral" | "success" | "warning" | "danger";

type BaseProps = {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
};

const COLORS = {
  text: "#0f172a",
  muted: "rgba(15,23,42,0.72)",
  border: "rgba(15,23,42,0.10)",
  bg: "#ffffff",
  bgSoft: "rgba(15,23,42,0.04)",
  shadow: "0 14px 28px rgba(15,23,42,0.10)",
  shadowSoft: "0 10px 22px rgba(15,23,42,0.08)",
  primary: "#0f172a",
};

function toneStyles(tone: Tone) {
  if (tone === "success") return { bg: "rgba(34,197,94,0.12)", fg: "#166534", bd: "rgba(34,197,94,0.25)" };
  if (tone === "warning") return { bg: "rgba(245,158,11,0.14)", fg: "#92400e", bd: "rgba(245,158,11,0.28)" };
  if (tone === "danger") return { bg: "rgba(239,68,68,0.12)", fg: "#991b1b", bd: "rgba(239,68,68,0.25)" };
  return { bg: "rgba(15,23,42,0.06)", fg: COLORS.text, bd: COLORS.border };
}

export function Container({
  children,
  style,
  maxWidth = 1100,
}: BaseProps & { maxWidth?: number }) {
  return (
    <div
      style={{
        maxWidth,
        margin: "0 auto",
        padding: "0 16px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Card({ children, style }: BaseProps) {
  return (
    <div
      style={{
        background: COLORS.bg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 18,
        padding: 16,
        boxShadow: COLORS.shadowSoft,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Row({
  children,
  style,
  gap = 10,
  align = "center",
  wrap = true,
}: BaseProps & {
  gap?: number;
  align?: React.CSSProperties["alignItems"];
  wrap?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: align,
        gap,
        flexWrap: wrap ? "wrap" : "nowrap",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Spacer() {
  return <div style={{ flex: 1 }} />;
}

export function Divider({ style }: { style?: React.CSSProperties }) {
  return (
    <hr
      style={{
        border: "none",
        borderTop: `1px solid ${COLORS.border}`,
        margin: "14px 0",
        ...style,
      }}
    />
  );
}

export function H1({ children, style }: BaseProps) {
  return (
    <h1
      style={{
        margin: "0 0 8px",
        fontSize: 34,
        lineHeight: 1.12,
        letterSpacing: 0.2,
        color: COLORS.text,
        ...style,
      }}
    >
      {children}
    </h1>
  );
}

export function Muted({ children, style }: BaseProps) {
  return (
    <div
      style={{
        color: COLORS.muted,
        fontSize: 14,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Alert({
  children,
  tone = "neutral",
  style,
}: BaseProps & { tone?: Tone }) {
  const t = toneStyles(tone);
  return (
    <div
      style={{
        background: t.bg,
        color: t.fg,
        border: `1px solid ${t.bd}`,
        borderRadius: 14,
        padding: "12px 12px",
        fontWeight: 700,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
  style,
}: BaseProps & { tone?: Tone }) {
  const t = toneStyles(tone);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 900,
        background: t.bg,
        color: t.fg,
        border: `1px solid ${t.bd}`,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  variant = "primary",
  loading,
  disabled,
  children,
  style,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
  style?: React.CSSProperties;
}) {
  const isDisabled = disabled || loading;

  const base: React.CSSProperties = {
    cursor: isDisabled ? "not-allowed" : "pointer",
    borderRadius: 14,
    padding: "10px 14px",
    fontWeight: 900,
    border: `1px solid ${COLORS.border}`,
    boxShadow: COLORS.shadowSoft,
    transition: "transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease",
    opacity: isDisabled ? 0.65 : 1,
  };

  const variants: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      background: COLORS.primary,
      color: "white",
      border: "1px solid rgba(15,23,42,0.20)",
      boxShadow: "0 14px 28px rgba(15,23,42,0.18)",
    },
    secondary: {
      background: "white",
      color: COLORS.text,
      border: `1px solid ${COLORS.border}`,
    },
    ghost: {
      background: COLORS.bgSoft,
      color: COLORS.text,
      border: `1px solid ${COLORS.border}`,
      boxShadow: "none",
    },
    danger: {
      background: "#ef4444",
      color: "white",
      border: "1px solid rgba(239,68,68,0.25)",
      boxShadow: "0 14px 28px rgba(239,68,68,0.18)",
    },
  };

  return (
    <button
      {...props}
      disabled={isDisabled}
      style={{
        ...base,
        ...variants[variant],
        ...style,
      }}
      onMouseDown={(e) => {
        if (isDisabled) return;
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(1px)";
      }}
      onMouseUp={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0px)";
      }}
    >
      {loading ? "Jobbar..." : children}
    </button>
  );
}
