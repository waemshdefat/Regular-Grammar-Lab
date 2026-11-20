import {
  ArrowLeftRight,
  ArrowRight,
  BookOpen,
  Braces,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  GitBranch,
  Languages,
  ListTree,
  Network,
  Play,
  Sparkles,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";
import { grammarToText } from "../lib/grammar";
import { LESSONS, QUIZ_QUESTIONS, SAMPLES } from "../lib/data";
import type { SectionId } from "../lib/types";
import {
  Badge,
  Card,
  ClassificationBadge,
  GrammarSummary,
  PageHeader,
  StatCard,
} from "./ui";
import type { AppContext } from "./viewTypes";

const SHORTCUTS: { section: SectionId; label: string; description: string; icon: LucideIcon }[] = [
  { section: "builder", label: "Grammar Builder", description: "Edit productions and validate syntax", icon: Braces },
  { section: "classification", label: "Classification", description: "Inspect every linear form", icon: GitBranch },
  { section: "conversion", label: "Grammar → NFA", description: "Construct highlighted transitions", icon: Network },
  { section: "simulator", label: "NFA Simulator", description: "Step through λ-closure", icon: Play },
  { section: "generator", label: "String Generator", description: "Bounded derivation search", icon: WandSparkles },
  { section: "derivation", label: "Derivations", description: "Replay each rewrite", icon: ListTree },
  { section: "reverse", label: "NFA → Grammar", description: "Edit an NFA and reverse it", icon: ArrowLeftRight },
  { section: "language", label: "Language Explorer", description: "Compare G and M", icon: Languages },
  { section: "learning", label: "Learning Center", description: "Seven guided lessons", icon: BookOpen },
  { section: "quiz", label: "Practice & Quiz", description: "Twelve explained questions", icon: ClipboardCheck },
];

export default function DashboardView({ ctx }: { ctx: AppContext }) {
  const moduleProgress = Math.min(1, ctx.visited.length / 12);
  const lessonProgress = ctx.completedLessons.length / LESSONS.length;
  const quizProgress = ctx.quizBest / QUIZ_QUESTIONS.length;
  const overall = Math.round(100 * (0.35 * moduleProgress + 0.4 * lessonProgress + 0.25 * quizProgress));
  const acceptedStates = ctx.activeNfa.finalIds.length;
  const quickSamples = SAMPLES.slice(0, 4);

  return (
    <div className="fade-in">
      <PageHeader
        eyebrow="Formal Languages & Automata Theory"
        title="Regular Grammar Lab"
        description="An interactive university project connecting regular grammars, regular languages, derivations, and nondeterministic finite automata through executable algorithms."
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => ctx.navigate("learning")}><BookOpen /> Start learning</button>
            <button className="btn btn-primary" onClick={() => ctx.navigate("builder")}>Open grammar lab <ArrowRight /></button>
          </>
        }
      />

      <div className="card p-6 md:p-7 mb-5 overflow-hidden relative" style={{ background: "linear-gradient(120deg, #0a1530 0%, #142353 55%, #29317c 100%)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}>
        <div className="absolute -right-16 -top-20 w-72 h-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(123,105,255,0.35), transparent 68%)" }} />
        <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_310px] gap-6 items-center">
          <div>
            <Badge tone="purple" icon={Sparkles}>Grammar to Automata · Interactive Lab</Badge>
            <h2 className="text-2xl md:text-3xl font-bold mt-4 tracking-tight">From production rules to accepting paths.</h2>
            <p className="text-[13px] leading-relaxed mt-3 max-w-2xl" style={{ color: "#c5d0ee" }}>
              Build a grammar, classify it structurally, convert it into a λ-NFA, simulate a word, generate derivations, reverse the construction, and verify the language. Every module operates on the same live data model.
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              <button className="btn btn-primary" onClick={() => { ctx.loadSample("classic"); ctx.navigate("conversion"); }}><Network /> Run the full pipeline</button>
              <button className="btn btn-secondary" style={{ background: "rgba(255,255,255,0.09)", color: "#fff", borderColor: "rgba(255,255,255,0.2)" }} onClick={() => ctx.navigate("about")}>Project overview <ChevronRight /></button>
            </div>
          </div>
          <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <svg viewBox="0 0 280 150" width="100%" height="150" role="img" aria-label="Example grammar to NFA diagram">
              <defs>
                <marker id="dashboard-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M 0 0 L 8 4 L 0 8 z" fill="#9b8cff" /></marker>
              </defs>
              <text x="8" y="18" fill="#aebde4" fontSize="10">S → aA | b</text>
              <text x="8" y="34" fill="#aebde4" fontSize="10">A → aS | λ</text>
              <line x1="22" y1="76" x2="52" y2="76" stroke="#9b8cff" strokeWidth="2" markerEnd="url(#dashboard-arrow)" />
              <text x="27" y="66" fill="#aebde4" fontSize="9">start</text>
              <circle cx="78" cy="76" r="24" fill="#101c3d" stroke="#9b8cff" strokeWidth="2" />
              <text x="78" y="81" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="700">S</text>
              <path d="M 102 68 C 135 38, 165 38, 194 68" fill="none" stroke="#9b8cff" strokeWidth="2" markerEnd="url(#dashboard-arrow)" />
              <text x="145" y="43" textAnchor="middle" fill="#fff" fontSize="11">a</text>
              <circle cx="204" cy="76" r="24" fill="#101c3d" stroke="#9b8cff" strokeWidth="2" />
              <text x="204" y="81" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="700">A</text>
              <path d="M 228 76 C 251 76, 251 76, 258 76" fill="none" stroke="#42d6a4" strokeWidth="2" markerEnd="url(#dashboard-arrow)" />
              <text x="241" y="66" textAnchor="middle" fill="#42d6a4" fontSize="11">λ</text>
              <circle cx="264" cy="76" r="18" fill="#101c3d" stroke="#42d6a4" strokeWidth="2" />
              <circle cx="264" cy="76" r="13" fill="none" stroke="#42d6a4" strokeWidth="1.4" />
              <text x="264" y="81" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">F</text>
              <text x="78" y="122" textAnchor="middle" fill="#8fa2d0" fontSize="9">variable</text>
              <text x="204" y="122" textAnchor="middle" fill="#8fa2d0" fontSize="9">variable</text>
              <text x="264" y="122" textAnchor="middle" fill="#8fa2d0" fontSize="9">final</text>
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Production alternatives" value={ctx.grammar.productions.length} icon={Braces} hint={`Start symbol ${ctx.grammar.start}`} />
        <StatCard label="Active NFA states" value={ctx.activeNfa.states.length} icon={Network} hint={`${ctx.activeNfa.transitions.length} transitions · ${acceptedStates} final`} />
        <StatCard label="Lessons completed" value={`${ctx.completedLessons.length}/${LESSONS.length}`} icon={BookOpen} hint="Saved in this browser" />
        <StatCard label="Best quiz score" value={`${ctx.quizBest}/${QUIZ_QUESTIONS.length}`} icon={ClipboardCheck} hint="Instantly explained answers" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-8 space-y-5">
          <Card
            title="Module shortcuts"
            subtitle="All tools share the current grammar and active automaton."
            action={<Badge tone="purple" icon={CheckCircle2}>{ctx.visited.length}/12 visited</Badge>}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {SHORTCUTS.map((item) => {
                const Icon = item.icon;
                return (
                  <button type="button" className="selection-card card-hover" key={item.section} onClick={() => ctx.navigate(item.section)}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg grid place-items-center flex-none" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}><Icon size={16} /></div>
                      <div className="min-w-0">
                        <div className="text-[12.5px] font-semibold">{item.label}</div>
                        <div className="text-[10.5px] mt-1" style={{ color: "var(--muted)" }}>{item.description}</div>
                      </div>
                      <ChevronRight size={14} className="ml-auto flex-none" style={{ color: "var(--faint)" }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card title="Current grammar" subtitle="Loaded into every derivation, classification, and conversion tool." action={<ClassificationBadge kind={ctx.analysis.kind} />}>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4">
              <div>
                <div className="code-box code-box-dark">{grammarToText(ctx.grammar) || "No productions"}</div>
                <div className="mt-3"><GrammarSummary analysis={ctx.analysis} /></div>
              </div>
              <div className="space-y-2">
                <button className="btn btn-secondary w-full btn-small" onClick={() => ctx.navigate("builder")}><Braces /> Edit rules</button>
                <button className="btn btn-secondary w-full btn-small" onClick={() => ctx.navigate("generator")}><WandSparkles /> Generate strings</button>
                <button className="btn btn-secondary w-full btn-small" disabled={!ctx.conversion.nfa} onClick={() => ctx.navigate("conversion")}><Network /> View NFA</button>
                <button className="btn btn-secondary w-full btn-small" onClick={() => ctx.navigate("simulator")}><Play /> Test a word</button>
              </div>
            </div>
          </Card>

          <Card title="Preset grammars" subtitle="Load an example and continue from any module.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickSamples.map((sample) => (
                <button type="button" className="selection-card" key={sample.id} onClick={() => { ctx.loadSample(sample.id); ctx.navigate("builder"); }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[12.5px] font-semibold">{sample.title}</div>
                    <Badge tone={sample.category === "Right-linear" ? "success" : "purple"}>{sample.category}</Badge>
                  </div>
                  <div className="math text-[11.5px] mt-2" style={{ color: "var(--accent)" }}>{sample.subtitle}</div>
                </button>
              ))}
            </div>
            <button className="btn btn-secondary w-full mt-3 btn-small" onClick={() => ctx.navigate("builder")}>See all {SAMPLES.length} presets <ArrowRight /></button>
          </Card>
        </div>

        <div className="xl:col-span-4 space-y-5">
          <Card title="Learning progress" subtitle="Computed from actual module visits, completed lessons, and quiz results.">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full grid place-items-center flex-none" style={{ background: `conic-gradient(var(--accent) ${overall * 3.6}deg, var(--surface-muted) 0deg)` }}>
                <div className="w-[76px] h-[76px] rounded-full grid place-items-center" style={{ background: "var(--surface)" }}>
                  <div className="text-center"><div className="text-xl font-bold">{overall}%</div><div className="text-[9px]" style={{ color: "var(--muted)" }}>complete</div></div>
                </div>
              </div>
              <div className="flex-1 space-y-2 text-[11.5px]">
                <div className="flex justify-between"><span style={{ color: "var(--muted)" }}>Modules</span><strong>{ctx.visited.length}/12</strong></div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${moduleProgress * 100}%` }} /></div>
                <div className="flex justify-between"><span style={{ color: "var(--muted)" }}>Lessons</span><strong>{ctx.completedLessons.length}/{LESSONS.length}</strong></div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${lessonProgress * 100}%` }} /></div>
                <div className="flex justify-between"><span style={{ color: "var(--muted)" }}>Quiz best</span><strong>{ctx.quizBest}/{QUIZ_QUESTIONS.length}</strong></div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${quizProgress * 100}%` }} /></div>
              </div>
            </div>
            <p className="text-[11px] mt-4" style={{ color: "var(--muted)" }}>Weighting: 35% module exploration, 40% lesson completion, 25% best quiz score.</p>
          </Card>

          <Card title="Suggested demonstration" subtitle="A complete live walkthrough in five steps.">
            <div className="space-y-2">
              {[
                { label: "Load the brief example", action: () => { ctx.loadSample("classic"); ctx.navigate("builder"); } },
                { label: "Inspect the classifier", action: () => ctx.navigate("classification") },
                { label: "Construct the λ-NFA", action: () => ctx.navigate("conversion") },
                { label: "Generate and replay a derivation", action: () => ctx.navigate("derivation") },
                { label: "Simulate the generated word", action: () => ctx.navigate("simulator") },
              ].map((item, index) => (
                <button type="button" className="step-card w-full text-left card-hover" key={item.label} onClick={item.action}>
                  <div className="step-number">{index + 1}</div>
                  <div className="text-[12px] font-semibold flex-1">{item.label}</div>
                  <ArrowRight size={14} style={{ color: "var(--accent)" }} />
                </button>
              ))}
            </div>
          </Card>

          <Card title="Theory snapshot" subtitle="The equivalence implemented by this project.">
            <div className="formula-box math text-[12px] leading-relaxed">Regular grammar ≡ λ-NFA ≡ DFA ≡ regular expression</div>
            <p className="text-[11.5px] mt-3 leading-relaxed" style={{ color: "var(--muted)" }}>
              This lab implements the grammar ⇄ NFA directions directly. It uses exact set-builder notation for L(G) and does not attempt to invent an unverified compact regular expression.
            </p>
            <button className="btn btn-secondary w-full mt-3 btn-small" onClick={() => ctx.navigate("about")}>Objectives, algorithms & limitations <ArrowRight /></button>
          </Card>
        </div>
      </div>
    </div>
  );
}
