import React from 'react';
import { GraduationCap, BookOpen, Layers, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';

export const AboutProjectView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Title Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-950/70 border border-purple-800/80 rounded-lg text-purple-400">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Regular Grammar Lab – Grammar to Automata
            </h2>
            <p className="text-xs text-purple-300 font-medium">
              CS Theory Academic Project & Interactive Demonstration Platform
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-800">
          This system is an interactive educational web platform built to demonstrate the fundamental equivalence between Type-3 Regular Grammars and Non-deterministic Finite Automata (NFA). It implements formal language parsing, syntactic classification, graph-based automata synthesis, and step-by-step non-deterministic string simulation.
        </p>
      </div>

      {/* Grid: Objectives & Theory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Objectives */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Project Objectives</h3>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
              <span>
                <strong>Grammar Specification & Diagnostics:</strong> Enable students to define production rules with arbitrary terminal and variable symbols, detecting syntax errors and start-symbol inconsistencies.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
              <span>
                <strong>Rigorous Classification:</strong> Differentiate strictly between Right-Linear, Left-Linear, Mixed Linear, and general Context-Free grammars according to formal definitions.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
              <span>
                <strong>Bidirectional Conversion:</strong> Execute formal algorithms to convert Right-Linear Grammars into NFAs (with multi-symbol chain expansion) and NFAs back into Right-Linear Grammars.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
              <span>
                <strong>Visual Trace Simulation:</strong> Provide visual step-by-step non-deterministic execution tracking active states, transition highlights, and λ-closures.
              </span>
            </li>
          </ul>
        </div>

        {/* Theoretical Concepts */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Theoretical Foundations</h3>
          </div>
          <div className="space-y-2.5 text-xs text-slate-300">
            <div>
              <strong className="text-purple-300">Chomsky Hierarchy (Type-3):</strong> Regular Grammars represent the least expressive level of generative grammars, having productions restricted to single variable locations.
            </div>
            <div>
              <strong className="text-indigo-300">Equivalence Triad (Kleene):</strong> Regular Grammars ≡ Regular Expressions ≡ Finite Automata (DFA/NFA). All recognize exactly the family of Regular Languages.
            </div>
            <div>
              <strong className="text-emerald-300">Uniform Directionality Requirement:</strong> A regular grammar must be uniformly right-linear OR uniformly left-linear. Mixing directions produces linear languages like {'{ aⁿbⁿ }'} that violate finite-state memory bounds.
            </div>
          </div>
        </div>
      </div>

      {/* Implemented Algorithms */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Cpu className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-white">Implemented Algorithms & Architecture</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-indigo-300">1. Right-Linear to NFA</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Direct variable-to-state mapping $V \mapsto Q$. Single terminal productions $A \to a$ transition to dedicated final state $q_f$. Multi-terminal productions $A \to a_1\dots a_k B$ are decomposed through $k-1$ intermediate states.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-blue-300">2. Left-Linear Dual to NFA</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Dual construction: starts at fresh initial state q₀ reading base terminals into state q_A, transitions from q_B to q_A on suffix w for rules A → Bw, and designates start variable state q_S as accepting. Reads input in forward order without string reversal.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-purple-300">3. NFA λ-Closure & Simulator</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Simulates parallel non-deterministic branching. Evaluates $\lambda$-closure via graph reachability BFS before and after every consumed symbol, terminating in an Accepted/Rejected verdict with full execution traces.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-emerald-300">4. Reverse NFA to Grammar</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Constructs an isomorphic right-linear grammar. Each state $q \in Q$ becomes a unique non-colliding variable $V_q$, each transition $\delta(q, a) \ni p$ produces $V_q \to a V_p$, and each final state $q_f \in F$ yields $V_f \to \lambda$.
            </p>
          </div>
        </div>
      </div>

      {/* Limitations and Scope */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">Project Scope & Theoretical Limitations</h3>
        </div>

        <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
          <p>
            • <strong>Mixed Linear Grammars:</strong> When a user enters rules that mix left-linear and right-linear forms, the grammar is classified as <em>Linear (Non-Regular)</em>. The platform correctly refuses direct NFA conversion because finite automata cannot handle synchronized opposite-ended reductions without stack storage.
          </p>
          <p>
            • <strong>General Context-Free Ambiguity:</strong> For arbitrary context-free grammars, equivalence and emptiness problems can be undecidable or computationally exponential. The lab focuses strictly on Type-3 regular grammars and bounded search derivations.
          </p>
          <p>
            • <strong>Infinite Derivations:</strong> Derivation search employs Breadth-First Search with depth and cycle checks to guarantee immediate responsiveness without browser freezing.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-xl p-5 text-xs text-slate-300 space-y-2">
        <div className="font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          Executive Summary
        </div>
        <p className="leading-relaxed">
          The Regular Grammar Lab provides students, educators, and computer scientists with an intuitive, mathematically rigorous platform that bridges the abstract theory of Formal Languages with concrete visual computation.
        </p>
      </div>
    </div>
  );
};
