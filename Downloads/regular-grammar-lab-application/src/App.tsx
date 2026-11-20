import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeftRight,
  BookOpen,
  Braces,
  ChevronRight,
  ClipboardCheck,
  GitBranch,
  Info,
  Languages,
  LayoutDashboard,
  ListTree,
  Menu,
  Moon,
  Network,
  Play,
  Sun,
  WandSparkles,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import { analyzeGrammar, generateStrings } from "./lib/grammar";
import { convertGrammarToNfa, makeDemoNfa } from "./lib/automata";
import { DEFAULT_SAMPLE_ID, LESSONS, QUIZ_QUESTIONS, sampleToGrammar } from "./lib/data";
import type { Grammar, Nfa, SectionId } from "./lib/types";
import type { AppContext } from "./components/viewTypes";
import BuilderView from "./components/BuilderView";
import ClassificationView from "./components/ClassificationView";
import ConversionView from "./components/ConversionView";
import SimulatorView from "./components/SimulatorView";
import DerivationView from "./components/DerivationView";
import ReverseView from "./components/ReverseView";
import LanguageView from "./components/LanguageView";
import LearningView from "./components/LearningView";
import QuizView from "./components/QuizView";
import DashboardView from "./components/DashboardView";
import AboutView from "./components/AboutView";
import { ClassificationBadge } from "./components/ui";

type NavItem = { id: SectionId; label: string; icon: LucideIcon };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  { label: "Overview", items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  {
    label: "Grammar laboratory",
    items: [
      { id: "builder", label: "Grammar Builder", icon: Braces },
      { id: "classification", label: "Classification", icon: GitBranch },
      { id: "conversion", label: "Grammar → NFA", icon: Network },
      { id: "simulator", label: "NFA Simulator", icon: Play },
      { id: "generator", label: "String Generator", icon: WandSparkles },
      { id: "derivation", label: "Derivation Visualizer", icon: ListTree },
      { id: "reverse", label: "NFA → Grammar", icon: ArrowLeftRight },
      { id: "language", label: "Language Explorer", icon: Languages },
    ],
  },
  {
    label: "Learning & assessment",
    items: [
      { id: "learning", label: "Learning Center", icon: BookOpen },
      { id: "quiz", label: "Practice & Quiz", icon: ClipboardCheck },
    ],
  },
  { label: "Project", items: [{ id: "about", label: "About Project", icon: Info }] },
];

const ALL_SECTIONS: SectionId[] = NAV_GROUPS.flatMap((group) => group.items.map((item) => item.id));
const STORAGE_PREFIX = "regular-grammar-lab:";

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    // The application remains functional if browser storage is disabled.
  }
}

function isGrammar(value: unknown): value is Grammar {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Grammar>;
  return (
    typeof candidate.start === "string" &&
    Array.isArray(candidate.productions) &&
    candidate.productions.every(
      (production) =>
        production &&
        typeof production.id === "string" &&
        typeof production.lhs === "string" &&
        typeof production.rhs === "string",
    )
  );
}

function initialGrammar(): Grammar {
  const stored = loadJson<unknown>("grammar", null);
  return isGrammar(stored) ? stored : sampleToGrammar(DEFAULT_SAMPLE_ID);
}

function initialSection(): SectionId {
  const stored = loadJson<string>("section", "dashboard");
  return ALL_SECTIONS.includes(stored as SectionId) ? (stored as SectionId) : "dashboard";
}

export default function App() {
  const [grammar, setGrammar] = useState<Grammar>(initialGrammar);
  const [sampleId, setSampleId] = useState<string>(() => loadJson<string>("sample", DEFAULT_SAMPLE_ID));
  const [section, setSection] = useState<SectionId>(initialSection);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => loadJson<"light" | "dark">("theme", "light"));
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => loadJson<string[]>("lessons", []));
  const [quizBest, setQuizBestState] = useState<number>(() => loadJson<number>("quizBest", 0));
  const [visited, setVisited] = useState<SectionId[]>(() => {
    const stored = loadJson<string[]>("visited", ["dashboard"]);
    return stored.filter((id): id is SectionId => ALL_SECTIONS.includes(id as SectionId));
  });
  const [simulatorInput, setSimulatorInput] = useState<string>(() => {
    const first = generateStrings(grammar, 4, 1).strings[0];
    return first ? first.value || "λ" : "a";
  });

  const analysis = useMemo(() => analyzeGrammar(grammar), [grammar]);
  const conversion = useMemo(() => convertGrammarToNfa(grammar, analysis), [grammar, analysis]);

  const [activeNfa, setActiveNfaState] = useState<Nfa>(() => conversion.nfa ?? makeDemoNfa());
  const [activeNfaLabel, setActiveNfaLabel] = useState<string>(() =>
    conversion.nfa ? "Grammar-converted NFA" : "Demo NFA",
  );

  useEffect(() => {
    if (conversion.nfa) {
      setActiveNfaState(conversion.nfa);
      setActiveNfaLabel("Grammar-converted NFA");
    } else {
      setActiveNfaLabel((current) =>
        current === "Grammar-converted NFA" ? "Last valid NFA (grammar changed)" : current,
      );
    }
  }, [grammar, conversion]);

  useEffect(() => {
    setVisited((current) => (current.includes(section) ? current : [...current, section]));
  }, [section]);

  useEffect(() => {
    saveJson("grammar", grammar);
    saveJson("sample", sampleId);
  }, [grammar, sampleId]);
  useEffect(() => saveJson("section", section), [section]);
  useEffect(() => saveJson("theme", theme), [theme]);
  useEffect(() => saveJson("lessons", completedLessons), [completedLessons]);
  useEffect(() => saveJson("quizBest", quizBest), [quizBest]);
  useEffect(() => saveJson("visited", visited), [visited]);

  const navigate = (target: SectionId) => {
    setSection(target);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateGrammar = (next: Grammar) => {
    setGrammar(next);
    setSampleId("custom");
  };

  const loadSample = (id: string) => {
    const next = sampleToGrammar(id);
    setGrammar(next);
    setSampleId(id);
    const first = generateStrings(next, 4, 1).strings[0];
    setSimulatorInput(first ? first.value || "λ" : "a");
  };

  const setActiveNfa = (nfa: Nfa, label: string) => {
    setActiveNfaState(nfa);
    setActiveNfaLabel(label);
  };

  const toggleLesson = (lessonId: string) => {
    setCompletedLessons((current) =>
      current.includes(lessonId) ? current.filter((id) => id !== lessonId) : [...current, lessonId],
    );
  };

  const ctx: AppContext = {
    grammar,
    updateGrammar,
    analysis,
    conversion,
    activeNfa,
    activeNfaLabel,
    setActiveNfa,
    navigate,
    loadSample,
    sampleId,
    completedLessons,
    toggleLesson,
    quizBest,
    setQuizBest: setQuizBestState,
    visited,
    simulatorInput,
    setSimulatorInput,
  };

  const currentLabel = NAV_GROUPS.flatMap((group) => group.items).find((item) => item.id === section)?.label ?? "Dashboard";
  const navCount = (id: SectionId): string | undefined => {
    if (id === "learning") return `${completedLessons.length}/${LESSONS.length}`;
    if (id === "quiz") return `${quizBest}/${QUIZ_QUESTIONS.length}`;
    return undefined;
  };

  let content: ReactNode;
  switch (section) {
    case "dashboard": content = <DashboardView ctx={ctx} />; break;
    case "builder": content = <BuilderView ctx={ctx} />; break;
    case "classification": content = <ClassificationView ctx={ctx} />; break;
    case "conversion": content = <ConversionView ctx={ctx} />; break;
    case "simulator": content = <SimulatorView ctx={ctx} />; break;
    case "generator": content = <DerivationView key="generator" ctx={ctx} mode="generator" />; break;
    case "derivation": content = <DerivationView key="derivation" ctx={ctx} mode="derivation" />; break;
    case "reverse": content = <ReverseView ctx={ctx} />; break;
    case "language": content = <LanguageView ctx={ctx} />; break;
    case "learning": content = <LearningView ctx={ctx} />; break;
    case "quiz": content = <QuizView ctx={ctx} />; break;
    case "about": content = <AboutView ctx={ctx} />; break;
    default: content = <DashboardView ctx={ctx} />;
  }

  return (
    <div className={`app-shell ${theme === "dark" ? "theme-dark" : ""}`}>
      <div className={`mobile-backdrop ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />
      <aside className={`sidebar ${sidebarOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-scroll">
          <div className="sidebar-brand">
            <div className="brand-mark"><Workflow size={22} /></div>
            <div className="min-w-0">
              <div className="text-[14px] font-bold tracking-tight text-white">Regular Grammar Lab</div>
              <div className="text-[10px] mt-0.5" style={{ color: "#9cadd5" }}>Grammar to Automata</div>
            </div>
          </div>
          <div className="px-2 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="text-[10px] uppercase tracking-wider font-bold" style={{ color: "#91a2cb" }}>Active grammar</div>
            <div className="text-[12px] font-semibold text-white mt-1 truncate">S = {grammar.start || "∅"} · {grammar.productions.length} rules</div>
            <div className="mt-2"><ClassificationBadge kind={analysis.kind} /></div>
          </div>
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="sidebar-group-label">{group.label}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const count = navCount(item.id);
                return (
                  <button
                    type="button"
                    key={item.id}
                    className={`sidebar-item ${section === item.id ? "active" : ""}`}
                    onClick={() => navigate(item.id)}
                  >
                    <Icon className="nav-icon" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {count ? <span className="nav-count">{count}</span> : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="sidebar-footer">
          <div className="flex justify-between items-center mb-2"><span>Exploration progress</span><span>{visited.length}/{ALL_SECTIONS.length}</span></div>
          <div className="progress-track" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div className="progress-fill" style={{ width: `${(visited.length / ALL_SECTIONS.length) * 100}%` }} />
          </div>
          <div className="mt-3 flex items-center gap-2" style={{ color: "#8fa2d0" }}><Workflow size={12} /> Browser-only · no external API</div>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="flex items-center gap-3 min-w-0">
            <button className="icon-btn mobile-menu" type="button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu /></button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: "var(--faint)" }}>
                <span className="hidden sm:inline">Regular Grammar Lab</span><ChevronRight size={12} className="hidden sm:block" /><span className="truncate">{currentLabel}</span>
              </div>
              <div className="text-[13px] font-bold truncate">Theory → Construction → Verification</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:block"><ClassificationBadge kind={analysis.kind} /></div>
            <button className="btn btn-secondary btn-small hidden sm:inline-flex" onClick={() => navigate("builder")}><Braces /> Grammar editor</button>
            <button
              className="icon-btn"
              type="button"
              title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              aria-label="Toggle color theme"
              onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
            >
              {theme === "light" ? <Moon /> : <Sun />}
            </button>
            {sidebarOpen ? <button className="icon-btn mobile-menu" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}><X /></button> : null}
          </div>
        </header>
        <main className="content-area">{content}</main>
        <footer className="px-6 pb-7 pt-2 text-[11px] flex flex-wrap items-center justify-between gap-2" style={{ color: "var(--faint)" }}>
          <span>Regular Grammar Lab · Formal Languages & Automata Theory · Interactive university project</span>
          <span>React · TypeScript · Tailwind CSS · Dagre · local algorithms</span>
        </footer>
      </div>
    </div>
  );
}
