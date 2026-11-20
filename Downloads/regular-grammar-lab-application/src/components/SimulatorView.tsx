import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CirclePlay,
  Pause,
  RotateCcw,
  SkipForward,
  StepForward,
  TerminalSquare,
  XCircle,
} from "lucide-react";
import { alphabetOf, languageExamples, simulateNfa, stateLabel } from "../lib/automata";
import { generateStrings } from "../lib/grammar";
import { LAMBDA } from "../lib/types";
import NfaGraph from "./NfaGraph";
import { Badge, Card, EmptyState, Formula, PageHeader } from "./ui";
import type { AppContext } from "./viewTypes";

export default function SimulatorView({ ctx }: { ctx: AppContext }) {
  const { activeNfa: nfa, simulatorInput, setSimulatorInput } = ctx;
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const simulation = useMemo(() => simulateNfa(nfa, simulatorInput), [nfa, simulatorInput]);
  const lastIndex = Math.max(0, simulation.steps.length - 1);

  useEffect(() => {
    setStepIndex(0);
    setPlaying(false);
  }, [nfa, simulatorInput]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setStepIndex((current) => Math.min(lastIndex, current + 1));
    }, 850);
    return () => window.clearInterval(timer);
  }, [playing, lastIndex]);

  useEffect(() => {
    if (playing && stepIndex >= lastIndex) setPlaying(false);
  }, [playing, stepIndex, lastIndex]);

  const currentStep = simulation.steps[Math.min(stepIndex, lastIndex)];
  const alphabet = useMemo(() => alphabetOf(nfa, ctx.grammar), [nfa, ctx.grammar]);
  const examples = useMemo(() => languageExamples(nfa, alphabet, 3), [nfa, alphabet]);
  const generated = useMemo(() => generateStrings(ctx.grammar, 5, 4).strings, [ctx.grammar]);
  const consumedCount = simulation.steps.slice(0, Math.min(stepIndex, lastIndex) + 1).filter((step) => step.consumed !== null).length;
  const inputChars = simulation.input.split("");
  const playbackComplete = stepIndex >= lastIndex;
  const quickWords = Array.from(new Set([
    ...generated.map((item) => item.value),
    ...examples.accepted.slice(0, 3),
    ...examples.rejected.slice(0, 2),
  ])).slice(0, 8);

  const jump = (index: number) => {
    setPlaying(false);
    setStepIndex(Math.max(0, Math.min(lastIndex, index)));
  };

  const replay = () => {
    setStepIndex(0);
    setPlaying(true);
  };

  return (
    <div className="fade-in">
      <PageHeader
        eyebrow="Module 04 · Interactive automaton"
        title="NFA Simulator"
        description="Enter a word and follow every nondeterministic branch. The simulator computes λ-closures, highlights consumed transitions, and records a complete execution trace."
        actions={
          <>
            <Badge tone="purple" icon={TerminalSquare}>{ctx.activeNfaLabel}</Badge>
            <button
              className="btn btn-secondary"
              onClick={() => {
                if (ctx.conversion.nfa) ctx.setActiveNfa(ctx.conversion.nfa, "Grammar-converted NFA");
                else ctx.navigate("builder");
              }}
            >
              Use converted NFA
            </button>
          </>
        }
      />

      {simulation.steps.length === 0 ? (
        <Card><EmptyState title="Automaton is incomplete" message={simulation.message} action={<button className="btn btn-primary" onClick={() => ctx.navigate("reverse")}>Edit the NFA</button>} /></Card>
      ) : (
        <>
          <Card
            title="Input configuration"
            subtitle={`Σ = {${alphabet.join(", ") || "∅"}}. Type λ to test the empty word; whitespace is ignored.`}
            action={<Badge tone={playbackComplete ? (simulation.accepted ? "success" : "danger") : "blue"}>Step {stepIndex} / {lastIndex}</Badge>}
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3">
              <div>
                <label className="field-label" htmlFor="simulator-word">Input word w ∈ Σ*</label>
                <input
                  id="simulator-word"
                  className="field field-math"
                  value={simulatorInput}
                  placeholder="aab, abba, or λ"
                  spellCheck={false}
                  onChange={(event) => setSimulatorInput(event.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <button className="btn btn-secondary" onClick={() => { setStepIndex(0); setPlaying(false); }}><RotateCcw /> Reset</button>
                <button className="btn btn-secondary" onClick={replay}><CirclePlay /> Replay</button>
                <button className="btn btn-secondary" onClick={() => jump(stepIndex - 1)} disabled={stepIndex === 0}><StepForward className="rotate-180" /> Back</button>
                <button className="btn btn-secondary" onClick={() => jump(stepIndex + 1)} disabled={stepIndex >= lastIndex}><SkipForward /> Step</button>
                <button className="btn btn-primary" onClick={() => setPlaying((value) => !value)} disabled={lastIndex === 0}>
                  {playing ? <Pause /> : <CirclePlay />} {playing ? "Pause" : "Play"}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4 items-center">
              <span className="text-[11px] font-semibold" style={{ color: "var(--muted)" }}>Quick words:</span>
              {quickWords.map((word) => (
                <button key={word} className="btn btn-ghost btn-small math" onClick={() => setSimulatorInput(word || LAMBDA)}>{word || LAMBDA}</button>
              ))}
            </div>

            <div className="mt-5 p-3 rounded-xl" style={{ background: "var(--surface-soft)", border: "1px solid var(--border)" }}>
              <div className="text-[10px] uppercase tracking-widest font-bold mb-3" style={{ color: "var(--faint)" }}>Input tape</div>
              <div className="flex flex-wrap gap-1.5">
                {inputChars.length === 0 ? (
                  <span className={`pill-box math ${consumedCount === 0 ? "active" : ""}`}>{LAMBDA} <span className="text-[10px] ml-1">empty word</span></span>
                ) : (
                  inputChars.map((character, index) => (
                    <span key={`${character}-${index}`} className={`pill-box math ${index < consumedCount ? "active" : ""}`}>
                      {character}
                      <span className="text-[9px] ml-1" style={{ color: "var(--faint)" }}>{index + 1}</span>
                    </span>
                  ))
                )}
                <span className="pill-box text-[10px]" style={{ color: "var(--muted)" }}>end ⊣</span>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 mt-5">
            <div className="xl:col-span-8 space-y-5">
              <Card
                title="Automaton state"
                subtitle="The highlighted set is the current λ-closed set of active states."
                action={
                  <div className={`notice py-1.5 px-3 ${!playbackComplete ? "" : simulation.accepted ? "notice-success" : "notice-danger"}`}>
                    {playbackComplete ? (simulation.accepted ? <CheckCircle2 /> : <XCircle />) : <span className="dot dot-warning" />}
                    <span className="font-semibold">{!playbackComplete ? "Simulation in progress" : simulation.accepted ? "Accepted" : "Rejected"}</span>
                  </div>
                }
              >
                <NfaGraph
                  nfa={nfa}
                  activeStates={currentStep?.after ?? [nfa.startId]}
                  activeTransitions={currentStep?.taken ?? []}
                  caption={`Step ${stepIndex}: ${currentStep?.consumed ? `reading "${currentStep.consumed}"` : "initial λ-closure"}`}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div className="p-3 rounded-xl" style={{ background: "var(--surface-soft)", border: "1px solid var(--border)" }}>
                    <div className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "var(--faint)" }}>Before this step</div>
                    <div className="math text-[13px] mt-2">{"{"}{(currentStep?.before ?? []).map((id) => stateLabel(nfa, id)).join(", ") || "∅"}{"}"}</div>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: "var(--surface-soft)", border: "1px solid var(--border)" }}>
                    <div className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "var(--faint)" }}>After transition + λ-closure</div>
                    <div className="math text-[13px] mt-2" style={{ color: "var(--accent)" }}>{"{"}{(currentStep?.after ?? []).map((id) => stateLabel(nfa, id)).join(", ") || "∅"}{"}"}</div>
                  </div>
                </div>
              </Card>

              <Card title="Execution trace" subtitle="Select a trace row to jump directly to that configuration.">
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {simulation.steps.map((step, index) => (
                    <button
                      type="button"
                      key={step.index}
                      className={`step-card w-full text-left ${index === stepIndex ? "active" : ""}`}
                      onClick={() => jump(index)}
                    >
                      <div className="step-number">{index}</div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-[12px] font-semibold">
                          {step.consumed ? <Badge tone={index === stepIndex ? "purple" : "neutral"}>read “{step.consumed}”</Badge> : <Badge tone="blue">λ-closure(q₀)</Badge>}
                          <span className="math">{"{"}{step.before.map((id) => stateLabel(nfa, id)).join(", ") || "∅"}{"}"}</span>
                          <span style={{ color: "var(--faint)" }}>⇒</span>
                          <span className="math" style={{ color: "var(--accent)" }}>{"{"}{step.after.map((id) => stateLabel(nfa, id)).join(", ") || "∅"}{"}"}</span>
                        </div>
                        <div className="text-[11.5px] mt-1.5 leading-relaxed" style={{ color: "var(--muted)" }}>{step.note}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            </div>

            <div className="xl:col-span-4 space-y-5">
              <Card title="Final verdict" subtitle="The verdict is reached after the full word is processed.">
                <div className={`notice ${playbackComplete ? (simulation.accepted ? "notice-success" : "notice-danger") : "notice-info"}`}>
                  {playbackComplete ? (simulation.accepted ? <CheckCircle2 /> : <XCircle />) : <span className="dot dot-warning" />}
                  <span>{playbackComplete ? simulation.message : `Continue the playback to reveal the verdict. ${simulation.steps.length - stepIndex - 1} step(s) remaining.`}</span>
                </div>
                <div className="mt-4">
                  <Formula caption="λ-closure is applied before the first symbol and after every consuming transition.">
                    δ̂(q₀, w) ∩ F ≠ ∅ &nbsp;⇔&nbsp; w ∈ L(M)
                  </Formula>
                </div>
                <div className="mt-4 space-y-2 text-[12px]" style={{ color: "var(--muted)" }}>
                  <div className="flex justify-between"><span>Input length</span><strong className="math">{simulation.input.length}</strong></div>
                  <div className="flex justify-between"><span>Trace steps</span><strong>{simulation.steps.length}</strong></div>
                  <div className="flex justify-between"><span>Initial state</span><strong className="math">{stateLabel(nfa, nfa.startId)}</strong></div>
                  <div className="flex justify-between"><span>Final states</span><strong className="math">{nfa.finalIds.map((id) => stateLabel(nfa, id)).join(", ") || "∅"}</strong></div>
                </div>
              </Card>

              <Card title="Membership samples" subtitle={`Exhaustively tested ${examples.tested} short words over Σ.`}>
                <div className="space-y-3">
                  <div>
                    <div className="text-[11px] font-bold mb-2" style={{ color: "var(--success)" }}>Accepted examples</div>
                    <div className="flex flex-wrap gap-1.5">
                      {examples.accepted.slice(0, 10).map((word) => <button key={`a-${word}`} className="badge badge-success math" onClick={() => setSimulatorInput(word)}>{word}</button>)}
                      {examples.accepted.length === 0 ? <span className="text-xs" style={{ color: "var(--muted)" }}>None in the tested range.</span> : null}
                    </div>
                  </div>
                  <div className="divider" />
                  <div>
                    <div className="text-[11px] font-bold mb-2" style={{ color: "var(--danger)" }}>Rejected examples</div>
                    <div className="flex flex-wrap gap-1.5">
                      {examples.rejected.slice(0, 10).map((word) => <button key={`r-${word}`} className="badge badge-danger math" onClick={() => setSimulatorInput(word)}>{word}</button>)}
                    </div>
                  </div>
                </div>
              </Card>

              {!ctx.analysis.convertible ? (
                <Card title="Source notice">
                  <p className="text-[12px] leading-relaxed" style={{ color: "var(--muted)" }}>
                    The current grammar is {ctx.analysis.label.toLowerCase()}, so the simulator is using <strong>{ctx.activeNfaLabel.toLowerCase()}</strong>. Load a convertible grammar to regenerate the NFA automatically.
                  </p>
                  <button className="btn btn-secondary w-full mt-3" onClick={() => ctx.loadSample("a-star")}>Load a regular example</button>
                </Card>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
