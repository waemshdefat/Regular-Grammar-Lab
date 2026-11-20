import { Fragment, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CirclePlay,
  ListTree,
  Pause,
  RefreshCw,
  RotateCcw,
  Send,
  SkipForward,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { deriveWord, generateStrings, grammarToText } from "../lib/grammar";
import { LAMBDA } from "../lib/types";
import {
  Badge,
  Card,
  EmptyState,
  Formula,
  IssueList,
  PageHeader,
  RuleText,
  SegmentedControl,
  TokenizedExpression,
} from "./ui";
import type { AppContext } from "./viewTypes";

type Tab = "generator" | "derivation";

export default function DerivationView({ ctx, mode }: { ctx: AppContext; mode: Tab }) {
  const [tab, setTab] = useState<Tab>(mode);
  const [depth, setDepth] = useState(6);
  const [limit, setLimit] = useState(10);
  const [nonce, setNonce] = useState(0);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [customWord, setCustomWord] = useState("");
  const [playStep, setPlayStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => setTab(mode), [mode]);

  const generation = useMemo(
    () => generateStrings(ctx.grammar, depth, limit),
    [ctx.grammar, depth, limit, nonce],
  );

  useEffect(() => {
    const values = generation.strings.map((item) => item.value);
    if (values.length === 0) setSelectedValue(null);
    else if (selectedValue === null || !values.includes(selectedValue)) setSelectedValue(values[0]);
  }, [generation, selectedValue]);

  const customResult = useMemo(
    () => (customWord.trim() ? deriveWord(ctx.grammar, customWord, 14) : null),
    [ctx.grammar, customWord],
  );

  const selectedGenerated = generation.strings.find((item) => item.value === selectedValue) ?? generation.strings[0];
  const usingCustom = Boolean(customResult?.accepted);
  const derivation = usingCustom ? customResult?.derivation ?? [] : selectedGenerated?.derivation ?? [];
  const activeWord = usingCustom ? customWord.trim() : selectedGenerated?.value ?? "";
  const derivationKey = `${activeWord}::${derivation.map((step) => step.form).join("⇒")}`;
  const lastStep = Math.max(0, derivation.length - 1);

  useEffect(() => {
    setPlayStep(0);
    setPlaying(false);
  }, [derivationKey]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setPlayStep((current) => Math.min(lastStep, current + 1));
    }, 900);
    return () => window.clearInterval(timer);
  }, [playing, lastStep]);

  useEffect(() => {
    if (playing && playStep >= lastStep) setPlaying(false);
  }, [playing, playStep, lastStep]);

  const sendToSimulator = (word: string) => {
    ctx.setSimulatorInput(word || LAMBDA);
    ctx.navigate("simulator");
  };

  const errorIssues = ctx.analysis.issues.filter((issue) => issue.level === "error");

  return (
    <div className="fade-in">
      <PageHeader
        eyebrow="Modules 05–06 · Derivations"
        title="Derivation Laboratory"
        description="Generate terminal strings by bounded breadth-first derivation, inspect every production used, and replay a derivation one rewrite at a time."
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => ctx.navigate("builder")}>Edit grammar</button>
            <button className="btn btn-primary" onClick={() => ctx.navigate("simulator")}><Send /> Simulator <ArrowRight /></button>
          </>
        }
      />

      <div className="mb-5">
        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: "generator", label: "String Generator", icon: WandSparkles },
            { value: "derivation", label: "Derivation Visualizer", icon: ListTree },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-8 space-y-5">
          {errorIssues.length > 0 ? (
            <Card title="Grammar warnings" subtitle="Generation still uses the entered productions, but the results should be interpreted carefully." padded>
              <IssueList issues={errorIssues} />
            </Card>
          ) : null}

          {tab === "generator" ? (
            <Card
              title="Generated language sample"
              subtitle={`${generation.strings.length} distinct terminal string(s) found within ${depth} derivation steps.`}
              action={<button className="btn btn-secondary btn-small" onClick={() => setNonce((value) => value + 1)}><RefreshCw /> Run search</button>}
            >
              {generation.strings.length === 0 ? (
                <EmptyState
                  icon={Sparkles}
                  title="No terminal strings reached"
                  message={generation.error ?? "Increase the derivation depth."}
                  action={<button className="btn btn-primary" onClick={() => setDepth((value) => Math.min(12, value + 2))}>Increase depth</button>}
                />
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {generation.strings.map((item) => (
                      <button
                        type="button"
                        key={item.value}
                        className={`selection-card ${selectedValue === item.value ? "selected" : ""}`}
                        onClick={() => setSelectedValue(item.value)}
                      >
                        <div className="math text-[17px] font-bold truncate"><TokenizedExpression value={item.display} /></div>
                        <div className="text-[10px] mt-2" style={{ color: "var(--muted)" }}>|w| = {item.value.length} · {item.depth} rewrite(s)</div>
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button className="btn btn-primary btn-small" onClick={() => { setSelectedValue(selectedGenerated?.value ?? null); setTab("derivation"); }}><ListTree /> Visualize selected derivation</button>
                    <button className="btn btn-secondary btn-small" onClick={() => sendToSimulator(selectedGenerated?.value ?? "")}><Send /> Test in NFA simulator</button>
                  </div>
                  {generation.truncated ? (
                    <div className="notice notice-info mt-4"><Sparkles /><span>The search was truncated by the depth, form-length, or work cap. This is intentional loop protection; results are a finite sample, not the full language.</span></div>
                  ) : null}
                </>
              )}
            </Card>
          ) : null}

          <Card
            title="Animated derivation"
            subtitle={usingCustom ? `Bounded derivation found for “${customWord.trim()}”.` : `Derivation for ${selectedGenerated?.display ?? LAMBDA}.`}
            action={
              <div className="flex flex-wrap gap-2">
                <Badge tone={derivation.length ? "purple" : "neutral"}>{derivation.length} sentential form{derivation.length === 1 ? "" : "s"}</Badge>
                <Badge tone="blue">Step {playStep} / {lastStep}</Badge>
              </div>
            }
          >
            {derivation.length === 0 ? (
              <EmptyState title="No derivation to display" message="Generate a string first, or enter a word that the grammar derives." />
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2 p-4 rounded-xl" style={{ background: "var(--surface-soft)", border: "1px solid var(--border)" }}>
                  {derivation.map((step, index) => (
                    <Fragment key={`${step.form}-${index}`}>
                      {index > 0 ? <span className="token-arrow math text-[15px]">⇒</span> : null}
                      <button
                        type="button"
                        className={`pill-box math text-[14px] fade-in ${index === playStep ? "active" : ""}`}
                        style={{ animationDelay: `${index * 45}ms`, opacity: index <= playStep ? 1 : 0.5 }}
                        onClick={() => { setPlaying(false); setPlayStep(index); }}
                      >
                        <TokenizedExpression value={step.form || LAMBDA} />
                      </button>
                    </Fragment>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <button className="btn btn-secondary btn-small" onClick={() => { setPlayStep(0); setPlaying(false); }}><RotateCcw /> Reset</button>
                  <button className="btn btn-secondary btn-small" onClick={() => { setPlayStep(0); setPlaying(true); }}><CirclePlay /> Replay</button>
                  <button className="btn btn-secondary btn-small" onClick={() => { setPlaying(false); setPlayStep((value) => Math.min(lastStep, value + 1)); }} disabled={playStep >= lastStep}><SkipForward /> Next rewrite</button>
                  <button className="btn btn-primary btn-small" onClick={() => setPlaying((value) => !value)}>{playing ? <Pause /> : <CirclePlay />} {playing ? "Pause" : "Play"}</button>
                  <button className="btn btn-secondary btn-small" onClick={() => sendToSimulator(activeWord)}><Send /> Test word</button>
                </div>

                <div className="mt-5">
                  <label className="field-label">Playback position</label>
                  <input
                    type="range" min={0} max={lastStep} value={Math.min(playStep, lastStep)} className="w-full"
                    onChange={(event) => { setPlaying(false); setPlayStep(Number(event.target.value)); }}
                  />
                </div>

                <div className="space-y-2 mt-5 max-h-[380px] overflow-y-auto pr-1">
                  {derivation.map((step, index) => (
                    <button
                      type="button"
                      key={`${step.form}-${index}-card`}
                      className={`step-card w-full text-left ${index === playStep ? "active" : ""}`}
                      onClick={() => { setPlaying(false); setPlayStep(index); }}
                    >
                      <div className="step-number">{index}</div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="math text-[13px] font-bold"><TokenizedExpression value={step.form || LAMBDA} /></span>
                          {step.rule ? <RuleText rule={step.rule} className="!text-[11px]" /> : <Badge tone="blue">start variable</Badge>}
                        </div>
                        <div className="text-[11.5px] mt-1.5" style={{ color: "var(--muted)" }}>{step.explanation}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </Card>

          {tab === "derivation" ? (
            <Card title="Check a custom word" subtitle="Use bounded derivation search to find a derivation for any word, including λ.">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
                <div>
                  <label className="field-label" htmlFor="custom-derivation-word">Word w</label>
                  <input
                    id="custom-derivation-word"
                    className="field field-math"
                    value={customWord}
                    placeholder="e.g. aab or λ"
                    spellCheck={false}
                    onChange={(event) => setCustomWord(event.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-secondary" onClick={() => setCustomWord("")}>Clear</button>
                  <button className="btn btn-secondary" onClick={() => sendToSimulator(customWord)}><Send /> Simulate</button>
                </div>
              </div>
              {customResult ? (
                <div className={`notice mt-4 ${customResult.accepted ? "notice-success" : "notice-danger"}`}>
                  {customResult.accepted ? <Sparkles /> : <RotateCcw />}
                  <span>{customResult.reason} {customResult.accepted ? "Its derivation is shown above." : "The generated-string derivation remains displayed above."}</span>
                </div>
              ) : null}
              <div className="mt-4">
                <Formula caption="The search is bounded: equal sentential forms are visited once, and depth, length, and work caps prevent infinite recursion.">
                  L(G) = {"{ w ∈ T* | S ⇒* w }"}
                </Formula>
              </div>
            </Card>
          ) : null}
        </div>

        <div className="xl:col-span-4 space-y-5">
          <Card title="Search configuration" subtitle="Applied to generation and custom-word derivation.">
            <label className="field-label" htmlFor="depth-range">Maximum derivation depth: {depth}</label>
            <input id="depth-range" type="range" min={1} max={12} value={depth} className="w-full" onChange={(event) => setDepth(Number(event.target.value))} />
            <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--faint)" }}><span>1</span><span>12 rewrites</span></div>
            <div className="mt-4">
              <label className="field-label" htmlFor="limit-select">Maximum distinct strings</label>
              <select id="limit-select" className="select" value={limit} onChange={(event) => setLimit(Number(event.target.value))}>
                <option value={6}>6 strings</option>
                <option value={10}>10 strings</option>
                <option value={16}>16 strings</option>
                <option value={20}>20 strings</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="pill-box"><div className="text-[10px]" style={{ color: "var(--muted)" }}>Forms explored</div><div className="text-lg font-bold">{generation.explored}</div></div>
              <div className="pill-box"><div className="text-[10px]" style={{ color: "var(--muted)" }}>Grammar class</div><div className="text-[12px] font-bold mt-1">{ctx.analysis.label}</div></div>
            </div>
            <p className="text-[11px] mt-3 leading-relaxed" style={{ color: "var(--muted)" }}>
              Breadth-first search finds short derivations first. A global visited set eliminates cycles such as A → B, B → A. The custom-word checker uses a deeper cap of 14 rewrites.
            </p>
          </Card>

          <Card title="Grammar used" subtitle="Every derivation above applies these exact productions.">
            <div className="code-box code-box-dark">{grammarToText(ctx.grammar) || "No productions"}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="blue">S = {ctx.grammar.start || "∅"}</Badge>
              <Badge tone="purple">{ctx.grammar.productions.length} alternatives</Badge>
              <Badge tone="neutral">T = {"{"}{ctx.analysis.terminals.join(", ") || "∅"}{"}"}</Badge>
            </div>
          </Card>

          <Card title="Selected string" subtitle="Send the word to any verification tool.">
            <div className="text-2xl font-bold math mb-3" style={{ color: "var(--accent)" }}><TokenizedExpression value={selectedGenerated?.display ?? LAMBDA} /></div>
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-secondary btn-small" onClick={() => setTab("derivation")}><ListTree /> Show derivation</button>
              <button className="btn btn-secondary btn-small" onClick={() => sendToSimulator(selectedGenerated?.value ?? "")}><Send /> NFA test</button>
              <button className="btn btn-secondary btn-small" onClick={() => ctx.navigate("language")}>Language explorer</button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
