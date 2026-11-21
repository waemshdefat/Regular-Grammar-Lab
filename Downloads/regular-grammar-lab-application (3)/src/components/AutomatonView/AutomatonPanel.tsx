import React, { useState, useEffect, useRef } from 'react';
import { Grammar, NFA, SimulationResult, SimulationStep } from '../../types/grammar';
import { convertGrammarToNfa } from '../../services/grammarToNfa';
import { simulateNFA, validateNFA } from '../../services/nfaSimulator';
import { AutomatonGraph } from './AutomatonGraph';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Cpu,
  FastForward,
  ArrowRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

interface AutomatonPanelProps {
  grammar: Grammar;
  isRightLinear: boolean;
  isLeftLinear?: boolean;
  isRegular?: boolean;
  onNavigateToBuilder?: () => void;
  presetInputString?: string;
}

export const AutomatonPanel: React.FC<AutomatonPanelProps> = ({
  grammar,
  isRightLinear,
  isLeftLinear = false,
  isRegular = true,
  onNavigateToBuilder,
  presetInputString
}) => {
  const [activeTab, setActiveTab] = useState<'graph' | 'steps' | 'table' | 'validation'>('graph');
  const [inputString, setInputString] = useState<string>('a');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1000); // ms per step
  const playTimerRef = useRef<number | null>(null);

  const isLeftLinearMode = isLeftLinear && !isRightLinear;

  // Compute NFA from regular grammar (Right-Linear or Left-Linear)
  const nfa: NFA = React.useMemo(() => {
    if (!isRegular || grammar.variables.length === 0) {
      return {
        states: [],
        alphabet: [],
        transitions: [],
        initialStateId: '',
        finalStateIds: [],
        conversionSteps: []
      };
    }
    return convertGrammarToNfa(grammar, isLeftLinearMode);
  }, [grammar, isRegular, isLeftLinearMode]);

  // Validate NFA
  const validation = React.useMemo(() => validateNFA(nfa), [nfa]);

  // Compute full simulation results
  const simulation: SimulationResult = React.useMemo(() => {
    if (nfa.states.length === 0) {
      return {
        inputString: '',
        accepted: false,
        steps: [],
        finalStateIds: [],
        reason: 'Automaton is empty.'
      };
    }
    return simulateNFA(nfa, inputString);
  }, [nfa, inputString]);

  // Handle incoming preset string
  useEffect(() => {
    if (presetInputString !== undefined) {
      setInputString(presetInputString === 'λ' ? '' : presetInputString);
      setCurrentStepIndex(0);
      setIsPlaying(false);
    }
  }, [presetInputString]);

  // Reset step index if simulation steps change
  useEffect(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, [inputString, nfa]);

  // Auto-play timer
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = window.setInterval(() => {
        setCurrentStepIndex(prev => {
          if (prev < simulation.steps.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, playbackSpeed);
    } else if (playTimerRef.current) {
      clearInterval(playTimerRef.current);
    }

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, playbackSpeed, simulation.steps.length]);

  const currentStep: SimulationStep | undefined = simulation.steps[currentStepIndex];
  const isFinished = currentStepIndex === simulation.steps.length - 1;

  if (!isRegular) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-4">
        <div className="w-14 h-14 bg-amber-950/60 border border-amber-800/80 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
          <HelpCircle className="w-8 h-8" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-lg font-bold text-white">NFA Conversion Requires a Regular Grammar</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            By formal language theory, finite automata can only be constructed directly for Regular Grammars (purely Right-Linear or purely Left-Linear). The currently active grammar is non-regular (Mixed Linear or Context-Free), which requires unbounded stack memory to evaluate.
          </p>
          {onNavigateToBuilder && (
            <button
              onClick={onNavigateToBuilder}
              className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition"
            >
              Load a Regular Grammar Preset in Grammar Builder <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Pre-generate quick test tokens based on grammar alphabet
  const quickTestTokens = [
    { label: 'λ (Empty)', val: '' },
    ...(grammar.terminals.length > 0
      ? [
          { label: `"${grammar.terminals[0]}"`, val: grammar.terminals[0] },
          {
            label: `"${grammar.terminals.join('')}"`,
            val: grammar.terminals.join('')
          }
        ]
      : [])
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">Automaton Visualization & NFA Simulator</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Constructed equivalent NFA $M = (Q, \Sigma, \delta, q_0, F)$ via {isLeftLinearMode ? 'Left-Linear Dual Construction' : 'Right-Linear Direct Mapping'} with {nfa.states.length} states and {nfa.transitions.length} transitions
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('graph')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition ${
              activeTab === 'graph' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Graph View
          </button>
          <button
            onClick={() => setActiveTab('steps')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition ${
              activeTab === 'steps' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Conversion Ledger ({nfa.conversionSteps.length})
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition ${
              activeTab === 'table' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Transition Table (δ)
          </button>
          <button
            onClick={() => setActiveTab('validation')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1.5 ${
              activeTab === 'validation' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            NFA Validation ({validation.issues.length})
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'graph' && (
        <div className="space-y-4">
          <AutomatonGraph
            nfa={nfa}
            activeStateIds={currentStep ? currentStep.activeStateIds : []}
            activeTransitions={currentStep ? currentStep.executedTransitions : []}
          />
        </div>
      )}

      {/* Conversion Steps Tab */}
      {activeTab === 'steps' && (
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          <p className="text-xs text-slate-400">
            Step-by-step trace showing how each Right-Linear production rule in $R$ was transformed into NFA states and transitions:
          </p>
          <div className="space-y-2">
            {nfa.conversionSteps.map(step => (
              <div
                key={step.stepNumber}
                className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-purple-400 font-bold bg-purple-950/60 border border-purple-800/60 px-2 py-0.5 rounded">
                    Step {step.stepNumber}: {step.rule}
                  </span>
                  {step.addedTransitions.length > 0 && (
                    <span className="text-[11px] text-emerald-400 font-mono">
                      +{step.addedTransitions.length} transition(s)
                    </span>
                  )}
                </div>
                <div className="text-slate-200 font-medium">{step.action}</div>
                <div className="text-slate-400 text-[11px]">{step.explanation}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transition Table Tab */}
      {activeTab === 'table' && (
        <div className="border border-slate-800 rounded-lg overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">State q</th>
                <th className="py-2.5 px-3">Type</th>
                {nfa.alphabet.map(sym => (
                  <th key={sym} className="py-2.5 px-3">
                    δ(q, {sym})
                  </th>
                ))}
                <th className="py-2.5 px-3">δ(q, λ)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {nfa.states.map(state => {
                return (
                  <tr key={state.id} className="hover:bg-slate-950/50 transition">
                    <td className="py-2.5 px-3 font-bold text-purple-300">
                      {state.label}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-sans text-[11px]">
                      {state.isInitial && state.isFinal
                        ? 'Initial + Final'
                        : state.isInitial
                        ? 'Initial (q₀)'
                        : state.isFinal
                        ? 'Accepting (F)'
                        : state.isIntermediate
                        ? 'Intermediate'
                        : 'Regular'}
                    </td>
                    {nfa.alphabet.map(sym => {
                      const targets = nfa.transitions
                        .filter(t => t.from === state.id && t.symbol === sym)
                        .map(t => {
                          const s = nfa.states.find(st => st.id === t.to);
                          return s ? s.label : t.to;
                        });
                      return (
                        <td key={sym} className="py-2.5 px-3 text-slate-300">
                          {targets.length > 0 ? `{ ${targets.join(', ')} }` : '∅'}
                        </td>
                      );
                    })}
                    {/* Lambda transitions */}
                    {(() => {
                      const targets = nfa.transitions
                        .filter(t => t.from === state.id && (t.symbol === 'λ' || t.symbol === 'ε'))
                        .map(t => {
                          const s = nfa.states.find(st => st.id === t.to);
                          return s ? s.label : t.to;
                        });
                      return (
                        <td className="py-2.5 px-3 text-slate-400">
                          {targets.length > 0 ? `{ ${targets.join(', ')} }` : '∅'}
                        </td>
                      );
                    })()}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* NFA Validation Tab */}
      {activeTab === 'validation' && (
        <div className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className={`w-5 h-5 ${validation.isValid ? 'text-emerald-400' : 'text-amber-400'}`} />
                <h3 className="text-sm font-bold text-white">NFA Theoretical Validation Report</h3>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase ${
                  validation.isValid
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}
              >
                {validation.isValid ? 'Valid Automaton' : 'Issues Found'}
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Total States |Q|</span>
                <div className="text-sm font-bold text-indigo-300 font-mono mt-0.5">{validation.stats.stateCount}</div>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Transitions |δ|</span>
                <div className="text-sm font-bold text-purple-300 font-mono mt-0.5">{validation.stats.transitionCount}</div>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Accepting States |F|</span>
                <div className="text-sm font-bold text-emerald-300 font-mono mt-0.5">{validation.stats.acceptingStateCount}</div>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">λ-Transitions</span>
                <div className="text-sm font-bold text-cyan-300 font-mono mt-0.5">{validation.stats.hasEpsilonTransitions ? 'Yes' : 'None'}</div>
              </div>
            </div>

            {/* Diagnostic Messages */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs uppercase font-semibold tracking-wider text-slate-400">
                Automaton Verification Checks ({validation.issues.length})
              </h4>
              {validation.issues.length === 0 ? (
                <div className="text-xs text-emerald-400 flex items-center gap-1.5 p-2 bg-emerald-950/20 rounded border border-emerald-900/40">
                  <CheckCircle2 className="w-4 h-4" />
                  All theoretical checks passed: Initial state is valid, transitions are well-formed, all states are reachable, and accepting states are consistent.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {validation.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                        issue.severity === 'error'
                          ? 'bg-red-950/30 border-red-800/60 text-red-200'
                          : issue.severity === 'warning'
                          ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      {issue.severity === 'error' ? (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      ) : issue.severity === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-bold uppercase text-[10px] mr-1.5 tracking-wider">
                          [{issue.severity}]:
                        </span>
                        <span>{issue.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Simulator Control Section */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Input text box */}
          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono whitespace-nowrap">
              Input String w:
            </span>
            <input
              type="text"
              value={inputString}
              onChange={e => setInputString(e.target.value)}
              placeholder="Enter string (e.g. aba, 01, or leave empty for λ)"
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded px-3 py-1.5 font-mono text-sm text-purple-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500">Quick:</span>
            {quickTestTokens.map((qt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInputString(qt.val)}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-[11px] font-mono text-slate-300 hover:text-white transition"
              >
                {qt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Playback Controls and Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (isFinished) {
                  setCurrentStepIndex(0);
                  setIsPlaying(true);
                } else {
                  setIsPlaying(!isPlaying);
                }
              }}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-sm active:scale-95"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> {isFinished ? 'Replay' : 'Play'}
                </>
              )}
            </button>

            <button
              disabled={isPlaying || isFinished}
              onClick={() => setCurrentStepIndex(i => Math.min(i + 1, simulation.steps.length - 1))}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition"
              title="Next Step"
            >
              <SkipForward className="w-3.5 h-3.5" /> Step
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentStepIndex(0);
              }}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
              title="Reset Simulation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Speed slider */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 pl-2">
              <FastForward className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={playbackSpeed}
                onChange={e => setPlaybackSpeed(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[11px] text-slate-300 focus:outline-none"
              >
                <option value={1500}>0.7x (Slow)</option>
                <option value={1000}>1.0x (Normal)</option>
                <option value={500}>2.0x (Fast)</option>
              </select>
            </div>
          </div>

          {/* Current Step Counter */}
          <div className="text-xs font-mono text-slate-400">
            Step <span className="text-purple-400 font-bold">{currentStepIndex}</span> / {simulation.steps.length - 1}
          </div>
        </div>

        {/* Current Execution State & String Visual Pointer */}
        {currentStep && (
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                  Active States:
                </span>
                <div className="flex flex-wrap gap-1 font-mono">
                  {currentStep.activeStateIds.length > 0 ? (
                    currentStep.activeStateIds.map(id => {
                      const state = nfa.states.find(s => s.id === id);
                      return (
                        <span
                          key={id}
                          className="px-2 py-0.5 bg-purple-950 border border-purple-800 text-purple-300 font-bold rounded"
                        >
                          {state ? state.label : id}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-red-400 font-semibold">∅ (Automaton dead/halted)</span>
                  )}
                </div>
              </div>

              {/* String pointer visualizer */}
              <div className="flex items-center gap-1 font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase mr-1">Input:</span>
                {inputString.length === 0 ? (
                  <span className="text-purple-300 font-bold">λ</span>
                ) : (
                  inputString.split('').map((ch, idx) => {
                    const isCurrent = idx === currentStepIndex - 1;
                    const isUpcoming = idx >= currentStepIndex;
                    return (
                      <span
                        key={idx}
                        className={`px-1 rounded ${
                          isCurrent
                            ? 'bg-purple-600 text-white font-bold ring-2 ring-purple-400'
                            : isUpcoming
                            ? 'text-slate-300'
                            : 'text-slate-500 line-through'
                        }`}
                      >
                        {ch}
                      </span>
                    );
                  })
                )}
              </div>
            </div>

            <div className="text-xs text-slate-300 font-sans">
              <strong>Action: </strong> {currentStep.description}
            </div>
          </div>
        )}

        {/* Acceptance Verdict Banner */}
        {isFinished && (
          <div
            className={`p-3.5 rounded-lg border flex items-start gap-3 transition-all ${
              simulation.accepted
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                : 'bg-red-950/40 border-red-800/80 text-red-200'
            }`}
          >
            {simulation.accepted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5 text-xs">
              <div className="font-bold text-sm uppercase tracking-wide">
                {simulation.accepted ? 'String Accepted (w ∈ L(G))' : 'String Rejected (w ∉ L(G))'}
              </div>
              <div className="text-slate-300">{simulation.reason}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
