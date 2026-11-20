import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  ArrowRight,
  Braces,
  CirclePlus,
  Network,
  Play,
  RefreshCcw,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { makeDemoNfa, nfaToGrammar } from "../lib/automata";
import { grammarToText, uid } from "../lib/grammar";
import { LAMBDA, type Nfa, type NfaTransition, type Production } from "../lib/types";
import NfaGraph from "./NfaGraph";
import {
  Badge,
  Card,
  EmptyState,
  Formula,
  IssueList,
  PageHeader,
  TokenizedExpression,
} from "./ui";
import type { AppContext } from "./viewTypes";

function cloneNfa(nfa: Nfa): Nfa {
  return {
    states: nfa.states.map((state) => ({ ...state })),
    transitions: nfa.transitions.map((transition) => ({ ...transition })),
    startId: nfa.startId,
    finalIds: [...nfa.finalIds],
  };
}

export default function ReverseView({ ctx }: { ctx: AppContext }) {
  const [nfa, setNfa] = useState<Nfa>(() => cloneNfa(ctx.activeNfa));
  const [selectedStep, setSelectedStep] = useState<number | null>(null);

  useEffect(() => {
    setNfa(cloneNfa(ctx.activeNfa));
    setSelectedStep(null);
  }, [ctx.activeNfa]);

  const reverse = useMemo(() => nfaToGrammar(nfa), [nfa]);
  const grouped = useMemo(() => {
    const map = new Map<string, Production[]>();
    for (const production of reverse.grammar.productions) {
      const list = map.get(production.lhs) ?? [];
      list.push(production);
      map.set(production.lhs, list);
    }
    const order = [reverse.grammar.start, ...Array.from(map.keys()).filter((key) => key !== reverse.grammar.start)];
    return order.filter((key) => map.has(key)).map((key) => ({ lhs: key, productions: map.get(key) ?? [] }));
  }, [reverse]);

  const updateStateLabel = (id: string, label: string) => {
    setNfa((current) => ({ ...current, states: current.states.map((state) => (state.id === id ? { ...state, label } : state)) }));
  };

  const toggleFinal = (id: string) => {
    setNfa((current) => ({
      ...current,
      finalIds: current.finalIds.includes(id) ? current.finalIds.filter((item) => item !== id) : [...current.finalIds, id],
    }));
  };

  const addState = () => {
    setNfa((current) => {
      const labels = new Set(current.states.map((state) => state.label));
      let index = current.states.length;
      while (labels.has(`q${index}`)) index += 1;
      const id = uid("state");
      return {
        ...current,
        states: [...current.states, { id, label: `q${index}`, kind: "variable" }],
        startId: current.startId || id,
      };
    });
  };

  const deleteState = (id: string) => {
    setNfa((current) => {
      const states = current.states.filter((state) => state.id !== id);
      return {
        states,
        transitions: current.transitions.filter((transition) => transition.from !== id && transition.to !== id),
        startId: current.startId === id ? (states[0]?.id ?? "") : current.startId,
        finalIds: current.finalIds.filter((item) => item !== id),
      };
    });
  };

  const addTransition = () => {
    setNfa((current) => {
      if (current.states.length === 0) return current;
      const from = current.startId || current.states[0].id;
      const to = current.finalIds[0] ?? current.states.find((state) => state.id !== from)?.id ?? from;
      const transition: NfaTransition = { id: uid("t"), from, to, label: "a" };
      return { ...current, transitions: [...current.transitions, transition] };
    });
  };

  const updateTransition = (id: string, field: "from" | "to" | "label", value: string) => {
    setNfa((current) => ({
      ...current,
      transitions: current.transitions.map((transition) => (transition.id === id ? { ...transition, [field]: value } : transition)),
    }));
  };

  const deleteTransition = (id: string) => {
    setNfa((current) => ({ ...current, transitions: current.transitions.filter((transition) => transition.id !== id) }));
  };

  const syncConverted = () => {
    const source = ctx.conversion.nfa ?? makeDemoNfa();
    setNfa(cloneNfa(source));
    ctx.setActiveNfa(cloneNfa(source), ctx.conversion.nfa ? "Grammar-converted NFA" : "Demo NFA");
    setSelectedStep(null);
  };

  const loadDemo = () => {
    const demo = makeDemoNfa();
    setNfa(cloneNfa(demo));
    setSelectedStep(null);
  };

  const useInSimulator = () => {
    ctx.setActiveNfa(cloneNfa(nfa), "Reverse-editor NFA");
    ctx.navigate("simulator");
  };

  const loadGrammarIntoBuilder = () => {
    ctx.updateGrammar({ start: reverse.grammar.start, productions: reverse.grammar.productions.map((production) => ({ ...production })) });
    ctx.navigate("builder");
  };

  const hasErrors = reverse.issues.some((issue) => issue.level === "error");

  return (
    <div className="fade-in">
      <PageHeader
        eyebrow="Module 07 · Automata to grammars"
        title="NFA → Regular Grammar"
        description="Edit an NFA and construct an equivalent right-linear grammar. Every state becomes a variable, every transition becomes a production, and every final state contributes λ."
        actions={
          <>
            <button className="btn btn-secondary" onClick={syncConverted}><RefreshCcw /> Sync converted NFA</button>
            <button className="btn btn-secondary" onClick={loadDemo}><WandSparkles /> Load demo NFA</button>
            <button className="btn btn-primary" onClick={useInSimulator}><Play /> Simulate this NFA</button>
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-7 space-y-5">
          <Card
            title="NFA definition editor"
            subtitle="Use λ (or ε) for an epsilon transition. State labels are mapped to uppercase grammar variables automatically."
            action={<Badge tone="purple" icon={Network}>{nfa.states.length} states · {nfa.transitions.length} transitions</Badge>}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--faint)" }}>States Q</h3>
              <button className="btn btn-secondary btn-small" onClick={addState}><CirclePlus /> Add state</button>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead><tr><th>Label</th><th className="text-center">Initial</th><th className="text-center">Final</th><th>Grammar variable</th><th></th></tr></thead>
                <tbody>
                  {nfa.states.length === 0 ? <tr><td colSpan={5} className="text-center py-6" style={{ color: "var(--muted)" }}>No states. Add one to begin.</td></tr> : null}
                  {nfa.states.map((state) => (
                    <tr key={state.id}>
                      <td><input className="field field-math !py-1.5" value={state.label} aria-label="State label" onChange={(event) => updateStateLabel(state.id, event.target.value)} /></td>
                      <td className="text-center"><input type="radio" name="nfa-initial" checked={nfa.startId === state.id} onChange={() => setNfa((current) => ({ ...current, startId: state.id }))} /></td>
                      <td className="text-center"><input type="checkbox" checked={nfa.finalIds.includes(state.id)} onChange={() => toggleFinal(state.id)} /></td>
                      <td className="math token-variable font-bold">{reverse.variableMap[state.id] ?? "—"}</td>
                      <td><button className="icon-btn tiny" title="Delete state" onClick={() => deleteState(state.id)}><Trash2 /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-5 mb-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--faint)" }}>Transition relation δ</h3>
              <button className="btn btn-secondary btn-small" onClick={addTransition}><CirclePlus /> Add transition</button>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead><tr><th>From q</th><th>Label</th><th>To p</th><th></th></tr></thead>
                <tbody>
                  {nfa.transitions.length === 0 ? <tr><td colSpan={4} className="text-center py-6" style={{ color: "var(--muted)" }}>No transitions. Final states still receive λ productions.</td></tr> : null}
                  {nfa.transitions.map((transition) => (
                    <tr key={transition.id}>
                      <td>
                        <select className="select !py-1.5" value={transition.from} onChange={(event) => updateTransition(transition.id, "from", event.target.value)}>
                          {nfa.states.map((state) => <option key={state.id} value={state.id}>{state.label}</option>)}
                        </select>
                      </td>
                      <td><input className="field field-math !py-1.5" value={transition.label} maxLength={8} aria-label="Transition label" onChange={(event) => updateTransition(transition.id, "label", event.target.value)} /></td>
                      <td>
                        <select className="select !py-1.5" value={transition.to} onChange={(event) => updateTransition(transition.id, "to", event.target.value)}>
                          {nfa.states.map((state) => <option key={state.id} value={state.id}>{state.label}</option>)}
                        </select>
                      </td>
                      <td><button className="icon-btn tiny" title="Delete transition" onClick={() => deleteTransition(transition.id)}><Trash2 /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4"><IssueList issues={reverse.issues} emptyMessage="The automaton definition is structurally valid." /></div>
          </Card>

          <Card title="Automaton preview" subtitle="The graph updates immediately after every editor change.">
            {nfa.states.length === 0 ? <EmptyState title="No automaton to draw" message="Add at least one state to see the graph." /> : <NfaGraph nfa={nfa} showLegend={false} />}
          </Card>
        </div>

        <div className="xl:col-span-5 space-y-5">
          <Card
            title="Generated right-linear grammar"
            subtitle={`Start symbol ${reverse.grammar.start} corresponds to the initial state.`}
            action={<Badge tone="success" icon={Braces}>{reverse.grammar.productions.length} productions</Badge>}
          >
            {grouped.length === 0 ? (
              <EmptyState title="No productions" message="Add states and transitions or mark a state as final." />
            ) : (
              <div className="space-y-3">
                {grouped.map((group) => (
                  <div key={group.lhs} className="p-3 rounded-xl" style={{ background: "var(--surface-soft)", border: "1px solid var(--border)" }}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="token-variable math font-bold text-[14px]">{group.lhs}</span>
                      <span className="token-arrow math">→</span>
                      {group.productions.map((production, index) => (
                        <span key={production.id} className="flex items-center gap-2">
                          {index > 0 ? <span className="token-arrow math">|</span> : null}
                          <span className="rule-box !py-1 !px-2"><TokenizedExpression value={production.rhs} /></span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="code-box code-box-dark">{grammarToText(reverse.grammar)}</div>
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              <button className="btn btn-primary btn-small" disabled={hasErrors || reverse.grammar.productions.length === 0} onClick={loadGrammarIntoBuilder}><ArrowLeftRight /> Load into builder</button>
              <button className="btn btn-secondary btn-small" onClick={useInSimulator}><Play /> Test automaton</button>
              <button className="btn btn-secondary btn-small" onClick={() => ctx.navigate("language")}>Language explorer <ArrowRight /></button>
            </div>
          </Card>

          <Card title="Conversion algorithm" subtitle="Select a step to inspect the corresponding rule.">
            <Formula caption="A final state may also have outgoing transitions; λ gives the derivation the option to stop.">
              {"q --a--> p  ⇒  Vq → aVp    ·    qf ∈ F  ⇒  Vqf → "}{LAMBDA}
            </Formula>
            <div className="space-y-2 max-h-[390px] overflow-y-auto pr-1 mt-4">
              {reverse.steps.map((step, index) => (
                <button
                  type="button"
                  key={`${index}-${step.slice(0, 24)}`}
                  className={`step-card w-full text-left ${selectedStep === index ? "active" : ""}`}
                  onClick={() => setSelectedStep(selectedStep === index ? null : index)}
                >
                  <div className="step-number">{index + 1}</div>
                  <div className="text-[12px] leading-relaxed flex-1">{step}</div>
                </button>
              ))}
            </div>
          </Card>

          <Card title="Equivalence argument" subtitle="Why the generated grammar describes the same language.">
            <div className="space-y-3 text-[12px] leading-relaxed" style={{ color: "var(--muted)" }}>
              <p>A derivation begins at the variable for the initial state. Each transition production emits exactly the symbol on that transition and moves to the destination variable.</p>
              <p>Thus a path spelling <span className="math">w</span> from q₀ to qf corresponds to <span className="math">Vq₀ ⇒* wVqf</span>.</p>
              <p>The production <span className="math">Vqf → {LAMBDA}</span> removes the final variable, giving <span className="math">w</span>. Conversely, every terminal derivation traces a valid accepting path.</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
