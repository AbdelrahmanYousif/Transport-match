import type { CSSProperties, ReactNode, ButtonHTMLAttributes, HTMLAttributes } from "react";

type Tone = "neutral" | "success" | "warning" | "danger";

type BaseProps = {
  children?: ReactNode;
  style?: CSSProperties;
} & Omit<HTMLAttributes<HTMLDivElement>, "style">;

// ---------- Small helpers ----------
const styles = {
  page: {
    padding: 16,
  } as CSSProperties,

  container: (maxWidth?: number) =>
    ({
      margin: "0 auto",
      padding: 16,
      maxWidth: maxWidth ?? 960,
    }) as CSSProperties,

  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 14,
    background: "#fff",
    boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
  } as CSSProperties,

  divider: {
    border: "none",
    borderTop: "1px solid #e5e7eb",
    margin: "14px 0",
  } as CSSProperties,

  h1: {
    margin: 0,
    fontSize: 28,
    letterSpacing: -0.2,
  } as CSSProperties,

  muted: {
    color: "#6b7280",
    fontSize: 14,
    lineHeight: 1.4,
  } as CSSProperties,

  row: (gap?: number, align?: CSSProperties["alignItems"], wrap?: boolean) =>
    ({
      display: "flex",
      alignItems: align ?? "center",
      gap: gap ?? 10,
      flexWrap: wrap ? "wrap" : "nowrap",
    }) as CSSProperties,

  spacer: {
    flex: 1,
    minWidth: 8,
  } as CSSProperties,

  // Buttons
  buttonBase: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid transparent",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 650,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    userSelect: "none",
  } as CSSProperties,

  buttonPrimary: {
    background: "#111827",
    color: "#fff",
    borderColor: "#111827",
  } as CSSProperties,

  buttonSecondary: {
    background: "#fff",
    color: "#111827",
    borderColor: "#d1d5db",
  } as CSSProperties,

  buttonGhost: {
    background: "transparent",
    color: "#111827",
    borderColor: "transparent",
  } as CSSProperties,

  buttonDanger: {
    background: "#9f1239",
    color: "#fff",
    borderColor: "#9f1239",
  } as CSSProperties,

  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  } as CSSProperties,

  // Alert
  alertBase: {
    borderRadius: 14,
    padding: 12,
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    color: "#111827",
    fontSize: 14,
  } as CSSProperties,

  // Badge
  badgeBase: {
    borderRadius: 999,
    padding: "6px 10px",
    border: "1px solid #e5e7eb",
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: "nowrap",
  } as CSSProperties,
};

// Tone palettes (Alert + Badge)
function toneColors(tone: Tone) {
  switch (tone) {
    case "success":
      return { bg: "#ecfdf5", border: "#10b98133", text: "#065f46" };
    case "warning":
      return { bg: "#fffbeb", border: "#f59e0b33", text: "#92400e" };
    case "danger":
      return { bg: "#fef2f2", border: "#ef444433", text: "#991b1b" };
    default:
      return { bg: "#f9fafb", border: "#e5e7eb", text: "#111827" };
  }
}

// ---------- Components ----------
export function Container({
  children,
  style,
  maxWidth,
  ...rest
}: BaseProps & { maxWidth?: number }) {
  return (
    <div style={{ ...styles.container(maxWidth), ...style }} {...rest}>
      {children}
    </div>
  );
}

export function Card({ children, style, ...rest }: BaseProps) {
  return (
    <div style={{ ...styles.card, ...style }} {...rest}>
      {children}
    </div>
  );
}

export function Divider({ style, ...rest }: { style?: CSSProperties } & React.ComponentProps<"hr">) {
  return <hr style={{ ...styles.divider, ...style }} {...rest} />;
}

export function H1({ children, style, ...rest }: BaseProps) {
  return (
    <h1 style={{ ...styles.h1, ...style }} {...rest}>
      {children}
    </h1>
  );
}

export function Muted({ children, style, ...rest }: BaseProps) {
  return (
    <div style={{ ...styles.muted, ...style }} {...rest}>
      {children}
    </div>
  );
}

export function Row({
  children,
  style,
  gap,
  align,
  wrap = true,
  ...rest
}: BaseProps & { gap?: number; align?: CSSProperties["alignItems"]; wrap?: boolean }) {
  return (
    <div style={{ ...styles.row(gap, align, wrap), ...style }} {...rest}>
      {children}
    </div>
  );
}

export function Spacer() {
  return <div style={styles.spacer} />;
}

export function Alert({
  children,
  style,
  tone = "neutral",
  ...rest
}: BaseProps & { tone?: Tone }) {
  const c = toneColors(tone);
  return (
    <div
      style={{
        ...styles.alertBase,
        background: c.bg,
        borderColor: c.border,
        color: c.text,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  style,
  tone = "neutral",
  ...rest
}: BaseProps & { tone?: Tone }) {
  const c = toneColors(tone);
  return (
    <span
      style={{
        ...styles.badgeBase,
        background: c.bg,
        borderColor: c.border,
        color: c.text,
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  children,
  style,
  variant = "primary",
  loading,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
  style?: CSSProperties;
}) {
  const variantStyle =
    variant === "primary"
      ? styles.buttonPrimary
      : variant === "secondary"
      ? styles.buttonSecondary
      : variant === "danger"
      ? styles.buttonDanger
      : styles.buttonGhost;

  const isDisabled = disabled || loading;

  return (
    <button
      {...rest}
      disabled={isDisabled}
      style={{
        ...styles.buttonBase,
        ...variantStyle,
        ...(isDisabled ? styles.buttonDisabled : null),
        ...style,
      }}
    >
      {loading ? "Jobbar..." : children}
    </button>
  );
}
