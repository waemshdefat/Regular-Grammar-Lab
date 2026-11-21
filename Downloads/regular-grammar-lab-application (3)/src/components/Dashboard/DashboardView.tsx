import React from 'react';
import { Grammar, GrammarClassificationResult } from '../../types/grammar';
import {
  Sparkles,
  Layers,
  Cpu,
  Play,
  ListOrdered,
  ArrowLeftRight,
  Compass,
  BookOpen,
  Award,
  ArrowRight,
  FileCode2,
  GraduationCap
} from 'lucide-react';

interface DashboardViewProps {
  grammar: Grammar;
  classification: GrammarClassificationResult;
  onNavigate: (tabId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  grammar,
  classification,
  onNavigate
}) => {
  const shortcutCards = [
    {
      id: 'builder',
      title: 'Grammar Builder',
      desc: 'Define variables, alphabet, and production rules with live syntax validation.',
      icon: <FileCode2 className="w-5 h-5 text-purple-400" />,
      badge: `${grammar.productions.length} Rules Active`
    },
    {
      id: 'classification',
      title: 'Grammar Classification',
      desc: 'Analyze whether rules are Right-Linear, Left-Linear, Linear, or Context-Free.',
      icon: <Layers className="w-5 h-5 text-indigo-400" />,
      badge: classification.typeName
    },
    {
      id: 'automaton',
      title: 'NFA Graph & Conversion',
      desc: 'Synthesize the equivalent NFA via Right-Linear direct mapping or Left-Linear dual construction.',
      icon: <Cpu className="w-5 h-5 text-emerald-400" />,
      badge: classification.isRegular ? 'Convertible (Type-3)' : 'Non-Regular (Linear/CFG)'
    },
    {
      id: 'automaton',
      title: 'Interactive Automaton Simulator',
      desc: 'Step through strings symbol by symbol with λ-closure tracking and verdict.',
      icon: <Play className="w-5 h-5 text-cyan-400" />,
      badge: 'Interactive'
    },
    {
      id: 'generator',
      title: 'String Generator & Derivations',
      desc: 'Generate valid strings in L(G) using BFS and visualize step-by-step replacements.',
      icon: <ListOrdered className="w-5 h-5 text-amber-400" />,
      badge: 'BFS Engine'
    },
    {
      id: 'nfa-to-grammar',
      title: 'NFA to Grammar Converter',
      desc: 'Execute reverse transformation from finite state diagrams to right-linear grammars.',
      icon: <ArrowLeftRight className="w-5 h-5 text-fuchsia-400" />,
      badge: 'Reverse Mapping'
    },
    {
      id: 'explorer',
      title: 'Language Explorer',
      desc: 'Inspect language semantics, check empty string membership, and batch-test strings.',
      icon: <Compass className="w-5 h-5 text-sky-400" />,
      badge: 'Properties'
    },
    {
      id: 'learning',
      title: 'Learning Center (7 Lessons)',
      desc: 'University curriculum modules from Linear Grammars to Kleene Equivalence.',
      icon: <BookOpen className="w-5 h-5 text-rose-400" />,
      badge: '7 Modules'
    },
    {
      id: 'quiz',
      title: 'Practice & Quiz Center',
      desc: '12 University-level multiple choice questions with feedback and score tracking.',
      icon: <Award className="w-5 h-5 text-yellow-400" />,
      badge: '12 Questions'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950/30 to-indigo-950/40 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-800/80 text-purple-300 text-xs font-semibold">
            <GraduationCap className="w-3.5 h-3.5" />
            Computer Science University Laboratory
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Regular Grammar Lab <span className="text-purple-400 font-light">–</span> Grammar to Automata
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            A comprehensive, interactive educational platform strictly based on Formal Languages and Automata Theory. Explore Right-Linear & Left-Linear Grammars, Regular Languages, and bidirectional NFA conversion with dynamic graph visualizations.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('builder')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition shadow-md active:scale-95"
            >
              Open Grammar Builder <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('automaton')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-2 transition"
            >
              Simulate Automaton <Play className="w-3.5 h-3.5 text-purple-400" />
            </button>
            <button
              onClick={() => onNavigate('learning')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-2 transition"
            >
              Read Lessons <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -top-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Active Grammar Overview Ribbon */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-purple-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              Active Grammar: <span className="font-mono text-purple-300 font-semibold">{grammar.productions.length} variable production rules</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              V = {'{' + grammar.variables.join(', ') + '}'} • Σ = {'{' + (grammar.terminals.join(', ') || '∅') + '}'} • Start = {grammar.startSymbol}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-lg border text-xs font-bold uppercase tracking-wider ${
              classification.isRegular
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}
          >
            {classification.typeName}
          </span>
          <button
            onClick={() => onNavigate('builder')}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Shortcuts Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          Laboratory Modules & Tools
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shortcutCards.map(card => (
            <div
              key={card.id + card.title}
              onClick={() => onNavigate(card.id)}
              className="group bg-slate-900 border border-slate-800 hover:border-purple-600/60 rounded-xl p-4 cursor-pointer transition shadow-sm hover:shadow-md hover:bg-slate-850 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg group-hover:scale-110 transition duration-200">
                    {card.icon}
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                    {card.badge}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-purple-400 font-semibold pt-2 border-t border-slate-800/60">
                <span>Launch Tool</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Theoretical Reference Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formal Definition */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            Formal Definition: Regular Grammar
          </h3>
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-mono text-xs text-purple-200 space-y-2 leading-relaxed">
            <div>G = (V, Σ, R, S)</div>
            <div className="text-slate-400 font-sans text-xs">
              Where <strong>V</strong> is a finite set of non-terminals, <strong>Σ</strong> is a finite alphabet of terminals disjoint from V, <strong>R</strong> is a set of productions, and <strong>S ∈ V</strong> is the designated start variable.
            </div>
          </div>
          <div className="text-xs text-slate-400 space-y-1">
            <div>• <strong>Right-Linear:</strong> Every rule is A → xB, A → x, or A → λ.</div>
            <div>• <strong>Left-Linear:</strong> Every rule is A → Bx, A → x, or A → λ.</div>
          </div>
        </div>

        {/* Chomsky Hierarchy */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-purple-400" />
            Chomsky Hierarchy Context
          </h3>
          <div className="space-y-1.5 text-xs">
            <div className="p-2 rounded bg-purple-950/60 border border-purple-800/80 flex items-center justify-between font-mono">
              <span className="text-purple-300 font-bold">Type 3: Regular Grammars</span>
              <span className="text-[11px] text-purple-400 font-sans">Finite Automata (DFA/NFA)</span>
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-slate-400">
              <span>Type 2: Context-Free</span>
              <span className="text-[11px] font-sans">Pushdown Automata (PDA)</span>
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-slate-500">
              <span>Type 1: Context-Sensitive</span>
              <span className="text-[11px] font-sans">Linear Bounded Automata</span>
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-slate-600">
              <span>Type 0: Unrestricted</span>
              <span className="text-[11px] font-sans">Turing Machines</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
