import React, { useState, useMemo } from 'react';
import { Grammar, GeneratedString, DerivationStep } from '../../types/grammar';
import { generateStringsFromGrammar, findDerivationForString } from '../../services/stringGenerator';
import { Sparkles, Search, ListOrdered, ExternalLink } from 'lucide-react';

interface StringGeneratorViewProps {
  grammar: Grammar;
  onTestInAutomaton: (str: string) => void;
}

export const StringGeneratorView: React.FC<StringGeneratorViewProps> = ({
  grammar,
  onTestInAutomaton
}) => {
  const [maxDepth, setMaxDepth] = useState<number>(6);
  const [maxStrings, setMaxStrings] = useState<number>(15);
  const [selectedDerivation, setSelectedDerivation] = useState<DerivationStep[] | null>(null);
  const [selectedString, setSelectedString] = useState<string>('');
  const [derivationStepIndex, setDerivationStepIndex] = useState<number>(0);

  // Target derivation searcher
  const [searchTarget, setSearchTarget] = useState<string>('');
  const [searchResult, setSearchResult] = useState<{ searched: boolean; found: boolean; error?: string }>({
    searched: false,
    found: false
  });

  // Generate strings automatically based on current depth and limits
  const generatedStrings: GeneratedString[] = useMemo(() => {
    return generateStringsFromGrammar(grammar, maxDepth, maxStrings);
  }, [grammar, maxDepth, maxStrings]);

  // Set initial selected derivation if available
  React.useEffect(() => {
    if (generatedStrings.length > 0 && !selectedDerivation) {
      setSelectedDerivation(generatedStrings[0].derivation);
      setSelectedString(generatedStrings[0].str);
      setDerivationStepIndex(generatedStrings[0].derivation.length);
    }
  }, [generatedStrings, selectedDerivation]);

  const handleSelectString = (item: GeneratedString) => {
    setSelectedString(item.str);
    setSelectedDerivation(item.derivation);
    setDerivationStepIndex(item.derivation.length);
  };

  const handleSearchDerivation = () => {
    if (!searchTarget.trim()) return;
    const found = findDerivationForString(grammar, searchTarget.trim());
    if (found) {
      setSelectedString(searchTarget.trim());
      setSelectedDerivation(found);
      setDerivationStepIndex(found.length);
      setSearchResult({ searched: true, found: true });
    } else {
      setSearchResult({
        searched: true,
        found: false,
        error: `String "${searchTarget.trim()}" could not be derived within bounded search depth.`
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Generator Controls Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-bold text-white">String Generator & Derivation Engine</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Generates strings in $L(G)$ via bounded Breadth-First Search (BFS) with cycle-loop prevention
            </p>
          </div>

          {/* Controls: Depth and Max Count */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Search Depth:</span>
              <input
                type="range"
                min={2}
                max={10}
                value={maxDepth}
                onChange={e => setMaxDepth(Number(e.target.value))}
                className="w-24 accent-purple-500 cursor-pointer"
              />
              <span className="font-mono font-bold text-purple-300 w-4">{maxDepth}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Max Strings:</span>
              <select
                value={maxStrings}
                onChange={e => setMaxStrings(Number(e.target.value))}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-300 text-xs focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={40}>40</option>
              </select>
            </div>
          </div>
        </div>

        {/* Target String Derivation Search Bar */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchTarget}
              onChange={e => {
                setSearchTarget(e.target.value);
                setSearchResult({ searched: false, found: false });
              }}
              onKeyDown={e => e.key === 'Enter' && handleSearchDerivation()}
              placeholder="Test if grammar derives a specific string (e.g. ababa, 0101)..."
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 font-mono text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <button
            onClick={handleSearchDerivation}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition"
          >
            Find Derivation
          </button>
        </div>

        {searchResult.searched && (
          <div
            className={`text-xs p-2.5 rounded-lg border ${
              searchResult.found
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                : 'bg-red-950/40 border-red-800 text-red-300'
            }`}
          >
            {searchResult.found
              ? `✓ Derivation found for "${searchTarget}"! Loaded into the visualizer below.`
              : searchResult.error}
          </div>
        )}

        {/* Table of Generated Strings */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Generated Strings ({generatedStrings.length} found)
            </span>
            <span className="text-[11px] text-slate-500">Sorted by string length</span>
          </div>

          {generatedStrings.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">
              No terminal strings derived within depth {maxDepth}. Try increasing search depth or verify that grammar has non-recursive terminal rules.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
              {generatedStrings.map((item, idx) => {
                const isSelected = selectedString === item.str;
                return (
                  <div
                    key={idx}
                    onClick={() => handleSelectString(item)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-purple-950/60 border-purple-500/80 text-white shadow-sm'
                        : 'bg-slate-950/80 border-slate-800/80 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="font-mono font-bold text-purple-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                        w = {item.str}
                      </span>
                      <span className="text-[10px] text-slate-400">|w| = {item.length}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          onTestInAutomaton(item.str);
                        }}
                        className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-purple-300"
                        title="Simulate this string in Automaton"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Step-by-Step Derivation Visualizer Card */}
      {selectedDerivation && selectedDerivation.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  Derivation Visualizer for <span className="font-mono text-purple-300">"{selectedString}"</span>
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Sequential production applications ($S \Rightarrow^* w$) across {selectedDerivation.length} step(s)
              </p>
            </div>

            {/* Stepper controls */}
            <div className="flex items-center gap-2">
              <button
                disabled={derivationStepIndex <= 0}
                onClick={() => setDerivationStepIndex(i => Math.max(0, i - 1))}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded text-xs text-slate-200"
              >
                Previous
              </button>
              <button
                disabled={derivationStepIndex >= selectedDerivation.length}
                onClick={() => setDerivationStepIndex(i => Math.min(selectedDerivation.length, i + 1))}
                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-30 rounded text-xs text-white font-medium"
              >
                Next Step
              </button>
              <button
                onClick={() => setDerivationStepIndex(selectedDerivation.length)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300"
              >
                Show All
              </button>
            </div>
          </div>

          {/* Derivation Chain Line (S => aA => ...) */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-sm overflow-x-auto">
            <div className="flex items-center flex-wrap gap-2 text-slate-200">
              <span className="font-bold text-indigo-400">{grammar.startSymbol}</span>
              {selectedDerivation.slice(0, derivationStepIndex).map((step, idx) => (
                <React.Fragment key={idx}>
                  <span className="text-purple-400">⇒</span>
                  <span
                    className={`px-1.5 py-0.5 rounded transition ${
                      idx === derivationStepIndex - 1
                        ? 'bg-purple-900/60 border border-purple-600 text-purple-200 font-bold'
                        : 'text-slate-300'
                    }`}
                  >
                    {step.nextForm}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Detailed step cards */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Derivation Steps Breakdown
            </h4>
            <div className="space-y-2">
              {selectedDerivation.slice(0, derivationStepIndex).map((step, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-slate-300 text-[11px] shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-mono text-slate-200">
                        <span className="text-slate-400">{step.sententialForm}</span>{' '}
                        <span className="text-purple-400 font-bold">⇒</span>{' '}
                        <span className="text-indigo-300 font-bold">{step.nextForm}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Replaced variable{' '}
                        <span className="font-mono text-purple-300 font-semibold">{step.replacedVariable}</span>{' '}
                        using rule <span className="font-mono text-indigo-300 font-bold">{step.ruleApplied}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800/80 shrink-0">
                    Rule: {step.ruleApplied}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
