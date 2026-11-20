import {
  ArrowRight,
  Braces,
  CheckCircle2,
  GitBranch,
  Network,
  XCircle,
} from "lucide-react";
import { LAMBDA, type ParsedProduction } from "../lib/types";
import {
  Badge,
  Card,
  ClassificationBadge,
  Formula,
  GrammarSummary,
  IssueList,
  PageHeader,
  RuleLine,
  TokenizedExpression,
} from "./ui";
import type { AppContext } from "./viewTypes";

function productionShape(item: ParsedProduction): { label: string; tone: "success" | "purple" | "blue" | "warning" | "danger" } {
  if (item.orientation === "none") return { label: "Invalid linear form", tone: "danger" };
  if (item.isEpsilon) return { label: "ε-production", tone: "blue" };
  if (item.orientation === "right") return { label: "A → xB", tone: "success" };
  if (item.orientation === "left") return { label: "A → Bx", tone: "purple" };
  if (item.variable) return { label: "Unit A → B (both)", tone: "warning" };
  return { label: "A → x (both)", tone: "blue" };
}

export default function ClassificationView({ ctx }: { ctx: AppContext }) {
  const { analysis, grammar } = ctx;
  const invalidShape = analysis.productions.filter((item) => item.orientation === "none");
  const multipleVariables = invalidShape.filter((item) => item.tokens.filter((token) => token.kind === "variable").length > 1);
  const rightOnly = analysis.productions.filter((item) => item.orientation === "right");
  const leftOnly = analysis.productions.filter((item) => item.orientation === "left");
  const epsilonConventionIssue = analysis.issues.find((issue) => issue.message.includes("Strict textbook convention"));

  const checks = [
    {
      label: "Valid syntax and start symbol",
      detail: analysis.valid ? "All LHS identifiers are variables and the grammar has productions." : "Fix structural errors reported below.",
      pass: analysis.valid,
    },
    {
      label: "At most one variable per right-hand side",
      detail: multipleVariables.length ? `${multipleVariables.length} production(s) contain more than one variable.` : "No RHS contains two or more variables.",
      pass: multipleVariables.length === 0,
    },
    {
      label: "Any variable sits at an edge",
      detail: invalidShape.length ? `${invalidShape.length} production(s) place a variable in an interior position.` : "Variables are rightmost or leftmost where present.",
      pass: invalidShape.length === 0,
    },
    {
      label: "One consistent orientation",
      detail: rightOnly.length && leftOnly.length ? "Both right-only and left-only productions were found." : `Right-only: ${rightOnly.length}; left-only: ${leftOnly.length}.`,
      pass: !(rightOnly.length > 0 && leftOnly.length > 0),
    },
    {
      label: `Strict ${grammar.start} → ${LAMBDA} convention`,
      detail: epsilonConventionIssue ? "The start symbol has λ and also occurs on a right-hand side." : "The strict textbook ε convention is satisfied (or does not apply).",
      pass: !epsilonConventionIssue,
    },
  ];

  return (
    <div className="fade-in">
      <PageHeader
        eyebrow="Module 02 · Structural analysis"
        title="Grammar Classification"
        description="The analyser applies the formal definitions of right-linear and left-linear grammars production by production. Classification is structural: it inspects variable position and orientation, not the semantic language."
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => ctx.navigate("builder")}><Braces /> Edit grammar</button>
            <button className="btn btn-primary" disabled={!analysis.convertible} onClick={() => ctx.navigate("conversion")}>Construct NFA <ArrowRight /></button>
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-7 space-y-5">
          <Card title="Production-by-production analysis" subtitle="Each row is parsed into terminal and variable tokens before its form is tested.">
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr><th>Production</th><th>Detected form</th><th>x ∈ T*</th><th>B ∈ V</th><th>Reason</th></tr>
                </thead>
                <tbody>
                  {analysis.productions.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8" style={{ color: "var(--muted)" }}>No productions to classify.</td></tr>
                  ) : (
                    analysis.productions.map((item) => {
                      const shape = productionShape(item);
                      return (
                        <tr key={item.id}>
                          <td><RuleLine production={{ id: item.id, lhs: item.lhs, rhs: item.rhs }} className="!text-[12px]" /></td>
                          <td><Badge tone={shape.tone}>{shape.label}</Badge></td>
                          <td className="math"><TokenizedExpression value={item.terminalString || LAMBDA} /></td>
                          <td className="math token-variable font-bold">{item.variable ?? "—"}</td>
                          <td className="text-[11.5px] max-w-[280px]" style={{ color: "var(--muted)" }}>{item.description}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Decision procedure" subtitle="This is the exact rule sequence used by the analyser.">
            <div className="space-y-2">
              {checks.map((check, index) => (
                <div className={`step-card ${check.pass ? "" : "active"}`} key={check.label}>
                  <div className="step-number">{index + 1}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-semibold text-[13px]">
                      {check.pass ? <CheckCircle2 size={15} style={{ color: "var(--success)" }} /> : <XCircle size={15} style={{ color: "var(--danger)" }} />}
                      {check.label}
                    </div>
                    <div className="text-[11.5px] mt-1" style={{ color: "var(--muted)" }}>{check.detail}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Formula caption="A grammar is regular only if it is entirely right-linear or entirely left-linear. Terminal-only and λ rules satisfy both.">
                Right-linear: A → xB | A → x &nbsp;&nbsp;·&nbsp;&nbsp; Left-linear: A → Bx | A → x &nbsp;&nbsp; (x ∈ T*)
              </Formula>
            </div>
          </Card>
        </div>

        <div className="xl:col-span-5 space-y-5">
          <Card
            title="Classification result"
            action={<ClassificationBadge kind={analysis.kind} />}
          >
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl grid place-items-center flex-none" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}><GitBranch size={21} /></div>
              <div>
                <div className="text-lg font-bold">{analysis.label}</div>
                <p className="text-[12.5px] mt-1 leading-relaxed" style={{ color: "var(--muted)" }}>{analysis.summary}</p>
              </div>
            </div>
            <div className="divider my-4" />
            <GrammarSummary analysis={analysis} />
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="pill-box"><div className="text-[10px]" style={{ color: "var(--muted)" }}>Right-only rules</div><div className="text-lg font-bold">{rightOnly.length}</div></div>
              <div className="pill-box"><div className="text-[10px]" style={{ color: "var(--muted)" }}>Left-only rules</div><div className="text-lg font-bold">{leftOnly.length}</div></div>
              <div className="pill-box"><div className="text-[10px]" style={{ color: "var(--muted)" }}>ε / terminal-only</div><div className="text-lg font-bold">{analysis.productions.filter((item) => item.orientation === "both").length}</div></div>
              <div className="pill-box"><div className="text-[10px]" style={{ color: "var(--muted)" }}>Invalid shapes</div><div className="text-lg font-bold">{invalidShape.length}</div></div>
            </div>
          </Card>

          <Card title="Diagnostics" subtitle="Errors block conversion; warnings explain definitional conventions and limitations.">
            <IssueList issues={analysis.issues} emptyMessage="Syntax is valid and all productions have a consistent regular form." />
          </Card>

          <Card title="Limitations of this classifier" subtitle="Important theory notes for interpreting the result.">
            <div className="space-y-3 text-[12px] leading-relaxed" style={{ color: "var(--muted)" }}>
              <p><strong style={{ color: "var(--text)" }}>Mixed orientation:</strong> a mixed grammar is not a regular grammar by definition, even if its language happens to be regular. A structural rewrite is required before conversion.</p>
              <p><strong style={{ color: "var(--text)" }}>Left-linear:</strong> the direct NFA constructor in this lab targets right-linear grammars. Reversing each RHS yields a right-linear grammar for the reversed language.</p>
              <p><strong style={{ color: "var(--text)" }}>Semantics:</strong> showing that a language is regular requires an equivalent finite automaton or regular expression; production shape alone cannot prove non-regularity of a language.</p>
            </div>
            <button className="btn btn-secondary w-full mt-4" onClick={() => ctx.navigate("language")}><Network /> Explore the language <ArrowRight /></button>
          </Card>
        </div>
      </div>
    </div>
  );
}
