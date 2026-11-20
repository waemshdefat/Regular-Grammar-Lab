import type { ReactNode } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";
import { compactExpression, isEpsilonMarker, tokenizeExpression } from "../lib/grammar";
import { LAMBDA, type Analysis, type ClassificationKind, type Issue, type Production } from "../lib/types";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6 fade-in">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="page-title">{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({
  title,
  subtitle,
  action,
  children,
  className = "",
  padded = true,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <div className={`${padded ? "px-5 pt-5" : "pt-5 px-5"} card-header`}>
          <div>
            {title ? <h2 className="card-title">{title}</h2> : null}
            {subtitle ? <p className="card-subtitle">{subtitle}</p> : null}
          </div>
          {action}
        </div>
      )}
      <div className={padded ? "p-5" : "pb-5"}>{children}</div>
    </section>
  );
}

export function Badge({
  children,
  tone = "neutral",
  icon: Icon,
}: {
  children: ReactNode;
  tone?: "neutral" | "purple" | "blue" | "success" | "warning" | "danger";
  icon?: LucideIcon;
}) {
  const className = tone === "neutral" ? "badge" : `badge badge-${tone}`;
  return (
    <span className={className}>
      {Icon ? <Icon /> : null}
      {children}
    </span>
  );
}

export function TokenizedExpression({ value, className = "" }: { value: string; className?: string }) {
  const compact = compactExpression(value);
  if (isEpsilonMarker(compact)) return <span className={`token-lambda math ${className}`}>{LAMBDA}</span>;
  return (
    <span className={`math ${className}`}>
      {tokenizeExpression(compact).map((token, index) => (
        <span key={`${token.value}-${index}`} className={token.kind === "variable" ? "token-variable" : "token-terminal"}>
          {token.value}
        </span>
      ))}
    </span>
  );
}

export function RuleLine({ production, className = "" }: { production: Production; className?: string }) {
  return (
    <span className={`rule-box ${className}`}>
      <span className="token-variable">{compactExpression(production.lhs) || "?"}</span>
      <span className="token-arrow">→</span>
      <TokenizedExpression value={production.rhs} />
    </span>
  );
}

export function RuleText({ rule, className = "" }: { rule: string; className?: string }) {
  const parts = rule.split("→");
  if (parts.length !== 2) return <span className={`math ${className}`}>{rule}</span>;
  return (
    <span className={`rule-box ${className}`}>
      <span className="token-variable">{parts[0].trim()}</span>
      <span className="token-arrow">→</span>
      <TokenizedExpression value={parts[1]} />
    </span>
  );
}

export function IssueList({ issues, emptyMessage = "No issues detected." }: { issues: Issue[]; emptyMessage?: string }) {
  if (issues.length === 0) {
    return (
      <div className="notice notice-success">
        <CheckCircle2 />
        <span>{emptyMessage}</span>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {issues.map((issue, index) => {
        const Icon = issue.level === "error" || issue.level === "warning" ? (issue.level === "error" ? AlertCircle : AlertTriangle) : Info;
        const tone =
          issue.level === "error" ? "notice-danger" : issue.level === "warning" ? "notice-warning" : "notice-info";
        return (
          <div className={`notice ${tone}`} key={`${issue.level}-${index}`}>
            <Icon />
            <span>
              <strong className="uppercase tracking-wide text-[10px] mr-1">{issue.level}</strong>
              {issue.message}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ClassificationBadge({ kind }: { kind: ClassificationKind }) {
  const map: Record<ClassificationKind, { label: string; tone: "success" | "purple" | "blue" | "warning" | "danger" }> = {
    "right-linear": { label: "Right-linear", tone: "success" },
    "left-linear": { label: "Left-linear", tone: "purple" },
    both: { label: "Both forms", tone: "blue" },
    mixed: { label: "Mixed", tone: "danger" },
    "non-regular": { label: "Non-regular shape", tone: "danger" },
    invalid: { label: "Invalid", tone: "warning" },
  };
  const item = map[kind];
  return <Badge tone={item.tone} icon={item.tone === "success" ? CheckCircle2 : item.tone === "danger" ? AlertCircle : Info}>{item.label}</Badge>;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  hint?: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon"><Icon /></div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {hint ? <div className="text-[10.5px] mt-1" style={{ color: "var(--faint)" }}>{hint}</div> : null}
    </div>
  );
}

export function EmptyState({ icon: Icon = Lightbulb, title, message, action }: { icon?: LucideIcon; title: string; message: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-5">
      <div className="w-12 h-12 rounded-2xl grid place-items-center mb-3" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
        <Icon size={22} />
      </div>
      <h3 className="font-semibold text-sm">{title}</h3>
      <p className="text-xs mt-1 max-w-md leading-relaxed" style={{ color: "var(--muted)" }}>{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; icon?: LucideIcon }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 p-1 rounded-xl" style={{ background: "var(--surface-muted)", border: "1px solid var(--border)" }}>
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`btn btn-small ${value === option.value ? "btn-primary" : "btn-ghost"}`}
          >
            {Icon ? <Icon /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function Formula({ children, caption }: { children: ReactNode; caption?: string }) {
  return (
    <div className="formula-box math text-[13px] leading-relaxed">
      <div>{children}</div>
      {caption ? <div className="text-[11px] mt-2" style={{ color: "var(--muted)" }}>{caption}</div> : null}
    </div>
  );
}

export function GrammarSummary({ analysis }: { analysis: Analysis }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span style={{ color: "var(--muted)" }}>V = {"{"}{analysis.variables.join(", ") || "∅"}{"}"}</span>
      <span style={{ color: "var(--border-strong)" }}>·</span>
      <span style={{ color: "var(--muted)" }}>T = {"{"}{analysis.terminals.join(", ") || "∅"}{"}"}</span>
      <span style={{ color: "var(--border-strong)" }}>·</span>
      <ClassificationBadge kind={analysis.kind} />
    </div>
  );
}
