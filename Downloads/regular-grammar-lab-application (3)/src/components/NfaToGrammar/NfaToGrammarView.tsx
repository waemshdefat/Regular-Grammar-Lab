import React, { useState } from 'react';
import { SAMPLE_NFAS, convertNfaToRegularGrammar } from '../../services/nfaToGrammar';
import { formatGrammarToText } from '../../services/grammarParser';
import { AutomatonGraph } from '../AutomatonView/AutomatonGraph';
import { ArrowLeftRight, Check, Copy, ArrowRight, Layers, Sparkles } from 'lucide-react';

interface NfaToGrammarViewProps {
  onLoadGrammarIntoLab: (grammarText: string, startSymbol: string) => void;
}

export const NfaToGrammarView: React.FC<NfaToGrammarViewProps> = ({
  onLoadGrammarIntoLab
}) => {
  const [selectedNfaId, setSelectedNfaId] = useState<string>('ends-with-b');
  const [copied, setCopied] = useState(false);

  const currentSample = SAMPLE_NFAS.find(s => s.id === selectedNfaId) || SAMPLE_NFAS[0];

  const conversionResult = React.useMemo(() => {
    return convertNfaToRegularGrammar(currentSample.nfa);
  }, [currentSample]);

  const grammarText = formatGrammarToText(conversionResult.grammar);

  const handleCopy = () => {
    navigator.clipboard.writeText(grammarText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview & Selector Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-bold text-white">NFA to Regular Grammar Converter</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Algorithm: Map each state q ∈ Q to a variable V_q, transitions δ(q, a) ∋ p to V_q → a V_p, and final states q_f ∈ F to V_f → λ.
            </p>
          </div>

          {/* Sample NFA selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Select NFA:</span>
            <select
              value={selectedNfaId}
              onChange={e => setSelectedNfaId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
            >
              {SAMPLE_NFAS.map(sample => (
                <option key={sample.id} value={sample.id}>
                  {sample.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* NFA Visual Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Source Automaton Diagram
            </span>
            <span className="text-purple-300 font-mono text-[11px]">{currentSample.description}</span>
          </div>
          <AutomatonGraph nfa={currentSample.nfa} />
        </div>

        {/* State to Variable Mapping Table */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            State-to-Variable Isomorphism Mapping:
          </h4>
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            {Object.entries(conversionResult.stateToVariableMap).map(([stateId, varName]) => (
              <span
                key={stateId}
                className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded text-slate-300 flex items-center gap-1.5"
              >
                <span>State <strong className="text-indigo-400">{stateId}</strong></span>
                <span className="text-purple-400 font-bold">↦</span>
                <span>Variable <strong className="text-purple-300">{varName}</strong></span>
                {stateId === currentSample.nfa.initialStateId && (
                  <span className="text-[10px] bg-indigo-950 text-indigo-400 px-1 py-0.2 rounded font-sans">
                    Start
                  </span>
                )}
                {currentSample.nfa.finalStateIds.includes(stateId) && (
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1 py-0.2 rounded font-sans">
                    Final
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Generated Grammar & Conversion Steps Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Generated Grammar Result */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Constructed Right-Linear Grammar
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs text-slate-300 flex items-center gap-1 transition"
                  title="Copy Grammar"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Grammar Code Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-sm text-purple-200 leading-relaxed shadow-inner">
              <pre className="whitespace-pre-wrap">{grammarText}</pre>
            </div>

            {/* Meta */}
            <div className="text-xs text-slate-400 space-y-1">
              <div>
                <strong>Variables (V): </strong>
                <span className="font-mono text-indigo-300 font-semibold">
                  {'{ ' + conversionResult.grammar.variables.join(', ') + ' }'}
                </span>
              </div>
              <div>
                <strong>Alphabet (Σ): </strong>
                <span className="font-mono text-emerald-300 font-semibold">
                  {'{ ' + conversionResult.grammar.terminals.join(', ') + ' }'}
                </span>
              </div>
              <div>
                <strong>Start Symbol: </strong>
                <span className="font-mono text-purple-300 font-bold">
                  {conversionResult.grammar.startSymbol}
                </span>
              </div>
            </div>
          </div>

          {/* Action button: Load into grammar lab */}
          <button
            onClick={() => onLoadGrammarIntoLab(grammarText, conversionResult.grammar.startSymbol)}
            className="w-full mt-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition shadow-md active:scale-95"
          >
            <span>Load Converted Grammar into Main Lab</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Step-by-Step Conversion Ledger */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Conversion Steps Ledger</h3>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {conversionResult.steps.map(step => (
              <div
                key={step.stepNumber}
                className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] font-mono">
                    Step {step.stepNumber} • {step.origin}
                  </span>
                  <span className="font-mono text-purple-300 font-bold bg-purple-950/70 border border-purple-800/80 px-2 py-0.5 rounded text-xs">
                    {step.generatedRule}
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] font-sans">{step.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
