import { useEffect, useState } from "react";
import {
  ArrowRight,
  CircleDot,
  Eye,
  Network,
  Play,
  Sparkles,
  Table2,
  Workflow,
} from "lucide-react";
import { stateLabel } from "../lib/automata";
import { LAMBDA } from "../lib/types";
import NfaGraph from "./NfaGraph";
import {
  Badge,
  Card,
  EmptyState,
  Formula,
  PageHeader,
} from "./ui";
import type { AppContext } from "./viewTypes";

export default function ConversionView({ ctx }: { ctx: AppContext }) {
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const { conversion, analysis } = ctx;
  const nfa = conversion.nfa;

  useEffect(() => {
    setSelectedStep(null);
  }, [conversion]);

  if (!nfa) {
    return (
      <div className="fade-in">
        <PageHeader
          eyebrow="Module 03 · Grammar to automata"
          title="Grammar → NFA Conversion"
          description="This construction accepts right-linear grammars and trivial terminal-only/ε grammars. Mixed, left-linear, and non-linear grammars require an equivalent right-linear form first."
          actions={<button className="btn btn-secondary" onClick={() => ctx.navigate("builder")}>Open grammar builder</button>}
        />
        <Card>
          <EmptyState
            icon={Workflow}
            title="Direct construction is unavailable"
            message={conversion.error ?? "The current grammar cannot be converted."}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <button className="btn btn-secondary" onClick={() => ctx.navigate("classification")}>Inspect classification</button>
                <button className="btn btn-primary" onClick={() => { ctx.loadSample("a-star"); ctx.navigate("conversion"); }}><Sparkles /> Load right-linear example</button>
              </div>
            }
          />
        </Card>
        <div className="mt-5">
          <Formula caption="Reversal is the standard bridge from a left-linear grammar to a right-linear construction.">
            A → Bx &nbsp; (left-linear) &nbsp; ⟶ &nbsp; A → xᴿB &nbsp; (right-linear for L(G)ᴿ)
          </Formula>
        </div>
      </div>
    );
  }

  const highlightedTransitions = selectedStep === null ? [] : conversion.stepHighlights[selectedStep] ?? [];
  const highlightedStates = Array.from(new Set(
    nfa.transitions
      .filter((transition) => highlightedTransitions.includes(transition.id))
      .flatMap((transition) => [transition.from, transition.to]),
  ));
  const lambdaCount = nfa.transitions.filter((transition) => transition.label === LAMBDA).length;
  const stateNames = nfa.states.map((state) => state.label).join(", ");
  const alphabet = Array.from(new Set(nfa.transitions.filter((transition) => transition.label !== LAMBDA).map((transition) => transition.label))).sort();

  return (
    <div className="fade-in">
      <PageHeader
        eyebrow="Module 03 · Grammar to automata"
        title="Grammar → NFA Conversion"
        description="A real construction: variables become states, a dedicated final state is added, and each production becomes a labelled transition chain. Select a construction step to highlight its edges."
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => ctx.navigate("builder")}>Edit grammar</button>
            <button
              className="btn btn-primary"
              onClick={() => { ctx.setActiveNfa(nfa, "Grammar-converted NFA"); ctx.navigate("simulator"); }}
            >
              <Play /> Simulate this NFA
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="pill-box"><div className="text-[10px]" style={{ color: "var(--muted)" }}>Grammar class</div><div className="font-semibold text-[13px] mt-1">{analysis.label}</div></div>
        <div className="pill-box"><div className="text-[10px]" style={{ color: "var(--muted)" }}>NFA states |Q|</div><div className="text-xl font-bold mt-1">{nfa.states.length}</div></div>
        <div className="pill-box"><div className="text-[10px]" style={{ color: "var(--muted)" }}>Transitions |δ|</div><div className="text-xl font-bold mt-1">{nfa.transitions.length}</div></div>
        <div className="pill-box"><div className="text-[10px]" style={{ color: "var(--muted)" }}>λ-transitions</div><div className="text-xl font-bold mt-1">{lambdaCount}</div></div>
      </div>

      <Card
        title="Constructed nondeterministic finite automaton"
        subtitle={`Layout generated from ${nfa.states.length} states and ${nfa.transitions.length} transitions. ${nfa.states.length - analysis.variables.length - 1} auxiliary state(s) split terminal strings.`}
        action={
          <div className="flex flex-wrap gap-2">
            {selectedStep !== null ? <button className="btn btn-ghost btn-small" onClick={() => setSelectedStep(null)}><Eye /> Show all</button> : null}
            <Badge tone="purple" icon={CircleDot}>{highlightedTransitions.length ? `${highlightedTransitions.length} highlighted` : "Full automaton"}</Badge>
          </div>
        }
      >
        <NfaGraph
          nfa={nfa}
          activeStates={highlightedStates}
          activeTransitions={highlightedTransitions}
          caption="Purple nodes/edges correspond to the selected construction step."
        />
        <div className="mt-4">
          <Formula caption="The extended transition relation δ̂ accepts w when its λ-closure intersects the final states.">
            M = (Q, Σ, δ, {stateLabel(nfa, nfa.startId)}, F) &nbsp;·&nbsp; Q = {"{"}{stateNames}{"}"} &nbsp;·&nbsp; Σ = {"{"}{alphabet.join(", ") || "∅"}{"}"}
          </Formula>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 mt-5">
        <div className="xl:col-span-7">
          <Card
            title="Construction steps"
            subtitle="Select any production step to see exactly which transitions it introduces."
            action={<Badge icon={Workflow}>{conversion.steps.length} steps</Badge>}
          >
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {conversion.steps.map((step, index) => {
                const ids = conversion.stepHighlights[index] ?? [];
                return (
                  <button
                    type="button"
                    className={`step-card w-full text-left ${selectedStep === index ? "active" : ""}`}
                    key={`${index}-${step.slice(0, 20)}`}
                    onClick={() => setSelectedStep(selectedStep === index ? null : index)}
                  >
                    <div className="step-number">{index + 1}</div>
                    <div className="flex-1">
                      <div className="text-[12.5px] leading-relaxed">{step}</div>
                      {ids.length > 0 ? <div className="text-[10.5px] mt-1" style={{ color: "var(--accent)" }}>{ids.length} transition{ids.length === 1 ? "" : "s"} created · click to highlight</div> : null}
                    </div>
                    <ArrowRight size={14} style={{ color: selectedStep === index ? "var(--accent)" : "var(--faint)" }} />
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
        <div className="xl:col-span-5 space-y-5">
          <Card title="Transition table δ" subtitle="One terminal symbol (or λ) is consumed per NFA transition.">
            <div className="table-scroll max-h-[420px] overflow-y-auto">
              <table className="data-table">
                <thead><tr><th>From</th><th>Label</th><th>To</th></tr></thead>
                <tbody>
                  {nfa.transitions.map((transition) => (
                    <tr key={transition.id} className={highlightedTransitions.includes(transition.id) ? "font-semibold" : ""}>
                      <td className="math">{stateLabel(nfa, transition.from)}</td>
                      <td><Badge tone={transition.label === LAMBDA ? "warning" : highlightedTransitions.includes(transition.id) ? "purple" : "blue"}>{transition.label}</Badge></td>
                      <td className="math">{stateLabel(nfa, transition.to)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card title="Why the construction is correct" subtitle="The invariant behind grammar derivations and automaton paths.">
            <div className="space-y-3 text-[12px] leading-relaxed" style={{ color: "var(--muted)" }}>
              <p>After a derivation <span className="math">S ⇒* wA</span>, the NFA has a path labelled <span className="math">w</span> from the initial state to state <span className="math">A</span>.</p>
              <p>Applying <span className="math">A → xB</span> emits <span className="math">x</span> and leaves <span className="math">B</span>; the automaton follows the chain labelled <span className="math">x</span> and reaches <span className="math">B</span>.</p>
              <p>A terminal-only or ε-production reaches <span className="math">F</span>, so the derivation ends exactly when the automaton accepts.</p>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <button className="btn btn-secondary btn-small" onClick={() => ctx.navigate("reverse")}><Network /> Reverse conversion <ArrowRight /></button>
              <button className="btn btn-secondary btn-small" onClick={() => ctx.navigate("language")}><Table2 /> Language explorer</button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
