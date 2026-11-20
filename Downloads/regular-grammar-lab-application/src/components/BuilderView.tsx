import { Fragment, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Braces,
  ChevronDown,
  ChevronUp,
  ClipboardPaste,
  FilePlus2,
  Network,
  Plus,
  RotateCcw,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { compactExpression, grammarToText, parseGrammarText, uid } from "../lib/grammar";
import { SAMPLES } from "../lib/data";
import { LAMBDA, type Production } from "../lib/types";
import {
  Badge,
  Card,
  ClassificationBadge,
  GrammarSummary,
  IssueList,
  PageHeader,
  RuleLine,
  TokenizedExpression,
} from "./ui";
import type { AppContext } from "./viewTypes";

export default function BuilderView({ ctx }: { ctx: AppContext }) {
  const { grammar, analysis, updateGrammar } = ctx;
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pasteErrors, setPasteErrors] = useState<string[]>([]);

  const editProduction = (id: string, field: "lhs" | "rhs", value: string) => {
    const productions = grammar.productions.map((production) =>
      production.id === id ? { ...production, [field]: value } : production,
    );
    updateGrammar({ ...grammar, productions });
  };

  const addProduction = () => {
    const production: Production = { id: uid("p"), lhs: grammar.start || "S", rhs: LAMBDA };
    updateGrammar({ ...grammar, productions: [...grammar.productions, production] });
  };

  const deleteProduction = (id: string) => {
    updateGrammar({ ...grammar, productions: grammar.productions.filter((production) => production.id !== id) });
  };

  const applyPastedRules = () => {
    const result = parseGrammarText(pasteText, compactExpression(grammar.start) || "S");
    setPasteErrors(result.errors);
    if (result.grammar.productions.length > 0) updateGrammar(result.grammar);
  };

  const togglePaste = () => {
    if (!pasteOpen) {
      setPasteText(grammarToText(grammar));
      setPasteErrors([]);
    }
    setPasteOpen((open) => !open);
  };

  const errors = analysis.issues.filter((issue) => issue.level === "error").length;
  const warnings = analysis.issues.filter((issue) => issue.level === "warning").length;

  return (
    <div className="fade-in">
      <PageHeader
        eyebrow="Module 01 · Grammar workspace"
        title="Grammar Builder"
        description="Enter one alternative per production row, identify variables and terminals, set the start symbol, and receive live syntax and regular-grammar validation."
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => ctx.navigate("classification")}><Braces /> Analyze grammar</button>
            <button className="btn btn-primary" onClick={() => ctx.navigate("conversion")}>Build NFA <ArrowRight /></button>
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-7 space-y-5">
          <Card
            title="Production editor"
            subtitle="Variables are uppercase; terminals are lowercase, digits, or symbols. λ (or ε) denotes the empty word."
            action={<Badge tone={errors ? "danger" : "success"}>{errors ? `${errors} error${errors === 1 ? "" : "s"}` : "Live validation"}</Badge>}
          >
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end mb-4">
              <div>
                <label className="field-label" htmlFor="start-symbol">Start symbol S ∈ V</label>
                <input
                  id="start-symbol"
                  className="field field-math"
                  value={grammar.start}
                  maxLength={8}
                  placeholder="S"
                  onChange={(event) => updateGrammar({ ...grammar, start: event.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <button className="btn btn-secondary" onClick={addProduction}><Plus /> Add rule</button>
                <button
                  className="btn btn-ghost"
                  title="Reset all rules"
                  onClick={() => updateGrammar({ start: "S", productions: [] })}
                >
                  <RotateCcw /> Clear
                </button>
              </div>
            </div>

            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr><th style={{ width: "26%" }}>Variable</th><th style={{ width: "38px" }}></th><th>Right-hand side</th><th style={{ width: "92px" }}>Action</th></tr>
                </thead>
                <tbody>
                  {grammar.productions.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8" style={{ color: "var(--muted)" }}>No productions yet. Add a rule or load a sample grammar.</td></tr>
                  ) : (
                    grammar.productions.map((production, index) => {
                      const rowErrors = analysis.issues.filter((issue) => issue.productionId === production.id && issue.level === "error");
                      return (
                        <Fragment key={production.id}>
                          <tr>
                            <td>
                              <input
                                className="field field-math token-variable"
                                value={production.lhs}
                                aria-label={`Left side of rule ${index + 1}`}
                                placeholder="S"
                                onChange={(event) => editProduction(production.id, "lhs", event.target.value)}
                              />
                            </td>
                            <td className="math text-center token-arrow">→</td>
                            <td>
                              <div className="flex gap-2 items-center">
                                <input
                                  className="field field-math"
                                  value={production.rhs}
                                  aria-label={`Right side of rule ${index + 1}`}
                                  placeholder="aA or λ"
                                  onChange={(event) => editProduction(production.id, "rhs", event.target.value)}
                                />
                                <button
                                  className="btn btn-ghost btn-small token-lambda math"
                                  title="Set this alternative to λ"
                                  onClick={() => editProduction(production.id, "rhs", LAMBDA)}
                                >
                                  λ
                                </button>
                              </div>
                            </td>
                            <td>
                              <button className="icon-btn tiny" title="Delete rule" onClick={() => deleteProduction(production.id)}><Trash2 /></button>
                            </td>
                          </tr>
                          {rowErrors.length > 0 ? (
                            <tr>
                              <td colSpan={4} className="!py-1 !px-4">
                                <div className="text-[11px]" style={{ color: "var(--danger)" }}>{rowErrors.map((issue) => issue.message).join(" ")}</div>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
              <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--muted)" }}>
                <span className="token-variable math font-bold">S, A</span> variables
                <span className="token-terminal math font-bold">a, b</span> terminals
                <span className="token-lambda math font-bold">λ</span> empty word
              </div>
              <button className="btn btn-secondary btn-small" onClick={togglePaste}>
                <ClipboardPaste /> {pasteOpen ? "Hide" : "Paste / import"} {pasteOpen ? <ChevronUp /> : <ChevronDown />}
              </button>
            </div>

            {pasteOpen ? (
              <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: "var(--border)" }}>
                <label className="field-label">Bulk rule syntax · one variable per line · use | for alternatives</label>
                <textarea
                  className="textarea field-math"
                  rows={6}
                  value={pasteText}
                  spellCheck={false}
                  placeholder={"S → aA | b\nA → aS | λ"}
                  onChange={(event) => setPasteText(event.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <button className="btn btn-primary btn-small" onClick={applyPastedRules}><FilePlus2 /> Apply rules</button>
                  <button className="btn btn-secondary btn-small" onClick={() => setPasteText(grammarToText(grammar))}>Format current grammar</button>
                </div>
                {pasteErrors.length > 0 ? <IssueList issues={pasteErrors.map((message) => ({ level: "error", message }))} /> : null}
                <p className="text-[11px]" style={{ color: "var(--muted)" }}>
                  Valid lines are imported even if other lines have errors; unresolved lines are reported above.
                </p>
              </div>
            ) : null}
          </Card>

          <Card title="Notation reference" subtitle="The analyser uses the following formal tuple and lexical conventions.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="formula-box math text-[13px]">G = (V, T, P, S)<span className="block text-[11px] mt-2 not-italic" style={{ color: "var(--muted)" }}>Variables V, terminals T, productions P, start S.</span></div>
              <div className="formula-box math text-[13px]">V ∩ T = ∅, &nbsp; S ∈ V<span className="block text-[11px] mt-2" style={{ color: "var(--muted)" }}>Uppercase identifiers are variables; everything else is a terminal character.</span></div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <RuleLine production={{ id: "example-1", lhs: "S", rhs: "aA" }} />
              <RuleLine production={{ id: "example-2", lhs: "A", rhs: "abB" }} />
              <RuleLine production={{ id: "example-3", lhs: "B", rhs: LAMBDA }} />
            </div>
            <p className="text-xs mt-3 leading-relaxed" style={{ color: "var(--muted)" }}>
              A terminal string x ∈ T* may contain several symbols. The converter splits x into one-symbol NFA transitions.
            </p>
          </Card>
        </div>

        <div className="xl:col-span-5 space-y-5">
          <Card
            title="Live classification"
            subtitle="Recomputed after every keystroke."
            action={<ClassificationBadge kind={analysis.kind} />}
          >
            <div className="space-y-4">
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>{analysis.summary}</p>
              <GrammarSummary analysis={analysis} />
              <div className="grid grid-cols-3 gap-2">
                <div className="pill-box text-center"><div className="text-lg font-bold">{grammar.productions.length}</div><div className="text-[10px]" style={{ color: "var(--muted)" }}>Productions</div></div>
                <div className="pill-box text-center"><div className="text-lg font-bold">{analysis.variables.length}</div><div className="text-[10px]" style={{ color: "var(--muted)" }}>Variables</div></div>
                <div className="pill-box text-center"><div className="text-lg font-bold">{analysis.terminals.length}</div><div className="text-[10px]" style={{ color: "var(--muted)" }}>Terminals</div></div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone={errors ? "danger" : "success"}>{errors} error{errors === 1 ? "" : "s"}</Badge>
                <Badge tone={warnings ? "warning" : "neutral"}>{warnings} warning{warnings === 1 ? "" : "s"}</Badge>
                <Badge tone={analysis.convertible ? "purple" : "neutral"}>{analysis.convertible ? "NFA-ready" : "Conversion blocked"}</Badge>
              </div>
              <IssueList issues={analysis.issues.slice(0, 4)} />
              {analysis.issues.length > 4 ? (
                <button className="btn btn-secondary btn-small w-full" onClick={() => ctx.navigate("classification")}>See all {analysis.issues.length} diagnostics <ArrowRight /></button>
              ) : null}
            </div>
          </Card>

          <Card
            title="Predefined examples"
            subtitle="Load a complete grammar and inspect its behaviour across every module."
            action={<Badge icon={BookOpen}>{SAMPLES.length} presets</Badge>}
          >
            <div className="space-y-2 max-h-[390px] overflow-y-auto pr-1">
              {SAMPLES.map((sample) => (
                <button
                  key={sample.id}
                  className={`selection-card ${ctx.sampleId === sample.id ? "selected" : ""}`}
                  onClick={() => ctx.loadSample(sample.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[13px] font-semibold">{sample.title}</div>
                      <div className="math text-[12px] mt-1" style={{ color: "var(--accent)" }}>{sample.subtitle}</div>
                    </div>
                    <Badge tone={sample.category === "Right-linear" ? "success" : sample.category === "Left-linear" ? "purple" : "danger"}>{sample.category}</Badge>
                  </div>
                  <p className="text-[11px] mt-2 leading-relaxed" style={{ color: "var(--muted)" }}>{sample.description}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card title="Quick workflow" subtitle="Shortcuts to the construction and verification tools.">
            <div className="grid grid-cols-2 gap-2">
              <button className="btn btn-secondary" onClick={() => ctx.navigate("generator")}><WandSparkles /> Generate strings</button>
              <button className="btn btn-secondary" onClick={() => ctx.navigate("simulator")}><Network /> Simulate</button>
              <button className="btn btn-secondary col-span-2" onClick={() => { ctx.loadSample("a-star"); ctx.navigate("classification"); }}>Try a minimal right-linear example <ArrowRight /></button>
            </div>
            <p className="text-[11px] mt-3" style={{ color: "var(--muted)" }}>
              Tip: use <TokenizedExpression value="λ" /> for the empty string. Whitespace is ignored; a row containing <TokenizedExpression value={LAMBDA} /> is an ε-production.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
