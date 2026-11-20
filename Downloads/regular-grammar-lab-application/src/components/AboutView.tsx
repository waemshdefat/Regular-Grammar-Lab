import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Cpu,
  Database,
  FlaskConical,
  GraduationCap,
  Layers,
  Lightbulb,
  ShieldAlert,
  Target,
  Workflow,
} from "lucide-react";
import { LESSONS, QUIZ_QUESTIONS, SAMPLES } from "../lib/data";
import { Badge, Card, Formula, PageHeader } from "./ui";
import type { AppContext } from "./viewTypes";

const OBJECTIVES = [
  "Provide an editable workspace for regular grammar syntax, variables, terminals, and λ-productions.",
  "Implement structural classification directly from the right-linear and left-linear definitions.",
  "Construct and visualise a λ-NFA from a supported right-linear grammar, including terminal-string chains.",
  "Simulate nondeterminism step by step with λ-closure, traces, and acceptance verdicts.",
  "Connect derivations, generated strings, reverse conversion, and formal-language descriptions in one environment.",
  "Support self-assessment through guided lessons, exercises, and an explained quiz.",
];

const CONCEPTS = [
  "G = (V, T, P, S)",
  "Right-linear A → xB | x",
  "Left-linear A → Bx | x",
  "λ / ε productions",
  "Derivation S ⇒* w",
  "λ-NFA and λ-closure",
  "δ̂ extended transition function",
  "Regular language equivalence",
  "Nondeterminism",
  "Reversal L(G)ᴿ",
  "Bounded BFS",
  "Set-builder notation",
];

const ALGORITHMS = [
  {
    title: "Grammar parsing and classification",
    detail: "Each RHS is tokenised into uppercase variable identifiers and single-character terminals. The analyser counts variables, checks edge position, combines orientations across all productions, and reports syntax/convention issues.",
  },
  {
    title: "Right-linear grammar → λ-NFA",
    detail: "One state per variable and a dedicated F. For A → xB, a chain labelled x reaches B; for A → x it reaches F; for A → λ it adds a λ-transition to F. Strings x ∈ T* introduce |x| − 1 intermediate states.",
  },
  {
    title: "NFA simulation with λ-closure",
    detail: "A worklist computes the ε-closure of a state set. For each input symbol, all matching transitions are followed in parallel and closure is recomputed. Acceptance requires a final state after the whole word is read.",
  },
  {
    title: "Bounded derivation search",
    detail: "Breadth-first search rewrites one variable at a time, records the production used, tracks a global visited set, and applies depth, length, and work caps. A variant searches for an exact target word.",
  },
  {
    title: "NFA → right-linear grammar",
    detail: "Map q ↦ Vq; q --a--> p becomes Vq → aVp; λ-transitions become unit productions; each final state contributes Vqf → λ. The initial state's variable is the start symbol.",
  },
  {
    title: "Bounded agreement audit",
    detail: "Short words over Σ are tested by exact NFA simulation and bounded grammar derivation. Matches and mismatches are reported with explicit scope, without claiming full equivalence from finite tests.",
  },
];

const LIMITATIONS = [
  "Direct NFA construction supports right-linear and trivial terminal-only grammars. Left-linear reversal is explained but not automatically performed as a complete graph-reversal pipeline.",
  "Mixed-orientation and non-linear grammars are deliberately blocked from direct conversion; a mixed grammar may still generate a regular language, but it is not a regular grammar by definition.",
  "String generation and exact-word derivation are bounded sampling procedures. They do not enumerate an infinite language and do not prove non-membership at unbounded depth.",
  "The Language Explorer does not infer an unverified compact regular expression; no full GNFA state elimination, regex simplification, DFA minimisation, or equivalence decision procedure is implemented.",
  "The lexical convention uses uppercase identifiers for variables and single characters for terminals. Grammars with more than 80 alternatives are rejected for interactive graph readability.",
  "Multi-symbol labels entered in the custom NFA editor are emitted as x ∈ T* grammar productions but are not expanded into one-symbol simulation transitions; use one symbol per transition for simulator accuracy.",
  "All state is kept in the browser (React state and localStorage). There is no server, account system, external AI service, or paid API dependency.",
];

export default function AboutView({ ctx }: { ctx: AppContext }) {
  return (
    <div className="fade-in">
      <PageHeader
        eyebrow="Module 12 · Project presentation"
        title="About the Project"
        description="A university-level formal languages project: theory, implemented algorithms, interactive verification, and a transparent account of what the software does and does not claim."
        actions={<button className="btn btn-primary" onClick={() => ctx.navigate("dashboard")}>Back to dashboard <ArrowRight /></button>}
      />

      <div className="card p-6 md:p-8 mb-5" style={{ background: "linear-gradient(135deg, #0a1530 0%, #142354 58%, #24327a 100%)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}>
        <div className="flex flex-col lg:flex-row justify-between gap-6">
          <div className="max-w-3xl">
            <div className="eyebrow" style={{ color: "#a99dff" }}>Formal Languages & Automata Theory</div>
            <h2 className="text-2xl md:text-3xl font-bold mt-2 tracking-tight">Regular Grammar Lab — Grammar to Automata</h2>
            <p className="text-[13px] leading-relaxed mt-3" style={{ color: "#c5d0ee" }}>
              An interactive, browser-based laboratory for right-linear and left-linear grammars, regular languages, NFA construction, λ-closure simulation, derivations, and reverse conversion. Every diagram and verdict is computed from the user's current grammar or automaton.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="badge" style={{ background: "rgba(255,255,255,0.1)", color: "#fff", borderColor: "rgba(255,255,255,0.2)" }}>React + TypeScript</span>
              <span className="badge" style={{ background: "rgba(255,255,255,0.1)", color: "#fff", borderColor: "rgba(255,255,255,0.2)" }}>Dagre graph layout</span>
              <span className="badge" style={{ background: "rgba(255,255,255,0.1)", color: "#fff", borderColor: "rgba(255,255,255,0.2)" }}>Client-side algorithms</span>
              <span className="badge" style={{ background: "rgba(255,255,255,0.1)", color: "#fff", borderColor: "rgba(255,255,255,0.2)" }}>No external API</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 min-w-[230px]">
            {[
              { value: "12", label: "Lab modules" },
              { value: String(LESSONS.length), label: "Guided lessons" },
              { value: String(QUIZ_QUESTIONS.length), label: "Quiz questions" },
              { value: String(SAMPLES.length), label: "Sample grammars" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div className="text-2xl font-bold">{item.value}</div>
                <div className="text-[10px] mt-1" style={{ color: "#b7c5e9" }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-7 space-y-5">
          <Card title="Project objectives" subtitle="What the application is designed to demonstrate.">
            <div className="space-y-2">
              {OBJECTIVES.map((objective, index) => (
                <div className="step-card" key={objective}>
                  <div className="step-number">{index + 1}</div>
                  <div className="text-[12.5px] leading-relaxed flex-1">{objective}</div>
                  <CheckCircle2 size={15} style={{ color: "var(--success)", marginTop: 4 }} />
                </div>
              ))}
            </div>
          </Card>

          <Card title="Algorithms implemented" subtitle="These are executable routines in src/lib, not illustrative mock-ups." action={<Badge tone="purple" icon={Cpu}>Client-side</Badge>}>
            <div className="space-y-2">
              {ALGORITHMS.map((algorithm, index) => (
                <div className="step-card" key={algorithm.title}>
                  <div className="step-number">{index + 1}</div>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold">{algorithm.title}</div>
                    <div className="text-[11.5px] mt-1 leading-relaxed" style={{ color: "var(--muted)" }}>{algorithm.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Module architecture" subtitle="Data flows from the grammar editor into analysis, construction, simulation, and assessment.">
            <div className="flex flex-wrap items-center gap-2">
              {["Grammar editor", "Parser & classifier", "NFA constructor", "λ-NFA simulator", "Generator / derivation", "Reverse conversion", "Explorer, lessons, quiz"].map((module, index, array) => (
                <span key={module} className="flex items-center gap-2">
                  <span className="pill-box text-[11px]">{module}</span>
                  {index < array.length - 1 ? <ArrowRight size={14} style={{ color: "var(--accent)" }} /> : null}
                </span>
              ))}
            </div>
            <div className="mt-4">
              <Formula caption="Shared typed model: Grammar, Analysis, NFA, ConversionResult, SimulationResult, ReverseResult.">
                G = (V, T, P, S) &nbsp;→&nbsp; M = (Q, Σ, δ, q₀, F) &nbsp;→&nbsp; L(G) = L(M)
              </Formula>
            </div>
          </Card>
        </div>

        <div className="xl:col-span-5 space-y-5">
          <Card title="Theoretical concepts" subtitle="Definitions and equivalences used throughout the project.">
            <div className="flex flex-wrap gap-1.5">
              {CONCEPTS.map((concept) => <span key={concept} className="badge badge-purple math">{concept}</span>)}
            </div>
            <div className="mt-4 space-y-2 text-[12px] leading-relaxed" style={{ color: "var(--muted)" }}>
              <p><strong style={{ color: "var(--text)" }}>Equivalence theorem:</strong> regular grammars, λ-NFAs, NFAs, DFAs, and regular expressions characterise the same class of languages.</p>
              <p><strong style={{ color: "var(--text)" }}>Structural distinction:</strong> a regular grammar is right-linear OR left-linear with one consistent orientation; a general linear grammar is weaker than a finite automaton only when its variable placement is unconstrained.</p>
            </div>
          </Card>

          <Card title="Project limitations" subtitle="An explicit scope statement for academic evaluation." action={<Badge tone="warning" icon={ShieldAlert}>Honest scope</Badge>}>
            <div className="space-y-2">
              {LIMITATIONS.map((limitation, index) => (
                <div className="notice notice-warning" key={limitation}>
                  <span className="math font-bold">{index + 1}.</span>
                  <span>{limitation}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Implementation & demonstration" subtitle="Everything needed for a live local demo.">
            <div className="grid grid-cols-2 gap-2">
              <div className="pill-box flex items-center gap-2"><Layers size={15} style={{ color: "var(--accent)" }} /><span className="text-[11px]">Modular React views</span></div>
              <div className="pill-box flex items-center gap-2"><Workflow size={15} style={{ color: "var(--accent)" }} /><span className="text-[11px]">Typed algorithm layer</span></div>
              <div className="pill-box flex items-center gap-2"><Database size={15} style={{ color: "var(--accent)" }} /><span className="text-[11px]">localStorage progress</span></div>
              <div className="pill-box flex items-center gap-2"><GraduationCap size={15} style={{ color: "var(--accent)" }} /><span className="text-[11px]">Guided assessment</span></div>
            </div>
            <div className="mt-4 space-y-2 text-[12px]" style={{ color: "var(--muted)" }}>
              <p className="flex gap-2"><BookOpen size={15} className="flex-none mt-0.5" style={{ color: "var(--accent)" }} /> Start with a preset in the Grammar Builder, then open Classification.</p>
              <p className="flex gap-2"><FlaskConical size={15} className="flex-none mt-0.5" style={{ color: "var(--accent)" }} /> Construct the NFA, select a construction step, and simulate a generated word.</p>
              <p className="flex gap-2"><Target size={15} className="flex-none mt-0.5" style={{ color: "var(--accent)" }} /> Edit the NFA in reverse conversion and load its grammar back into the builder.</p>
            </div>
          </Card>

          <Card title="Summary" subtitle="What the finished application demonstrates.">
            <div className="notice notice-success"><Lightbulb /><span>The project turns the textbook equivalence between regular grammars and finite automata into an inspectable pipeline: edit, classify, construct, simulate, derive, reverse, explore, learn, and assess. All computations are local, reproducible, and tied to the actual grammars and automata shown on screen.</span></div>
          </Card>
        </div>
      </div>
    </div>
  );
}
