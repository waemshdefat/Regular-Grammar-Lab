import React, { useState } from 'react';
import { Grammar } from '../../types/grammar';
import { SAMPLE_GRAMMARS, SampleGrammar } from '../../services/sampleGrammars';
import { Plus, Trash2, CheckCircle2, AlertTriangle, Code, ListFilter, Sparkles, BookOpen } from 'lucide-react';

interface GrammarBuilderProps {
  grammar: Grammar;
  rawGrammarText: string;
  errors: string[];
  warnings: string[];
  onTextChange: (text: string, customStart?: string) => void;
  onLoadSample: (sample: SampleGrammar) => void;
}

export const GrammarBuilder: React.FC<GrammarBuilderProps> = ({
  grammar,
  rawGrammarText,
  errors,
  warnings,
  onTextChange,
  onLoadSample
}) => {
  const [editorMode, setEditorMode] = useState<'visual' | 'text'>('text');
  const [selectedSampleId, setSelectedSampleId] = useState<string>('sample-1');

  // Quick insert symbols
  const insertSymbol = (sym: string) => {
    onTextChange(rawGrammarText + sym);
  };

  const handleStartSymbolChange = (newStart: string) => {
    onTextChange(rawGrammarText, newStart);
  };

  // Visual rule editing actions
  const handleAddRule = () => {
    const defaultNextVar = ['S', 'A', 'B', 'C', 'D'].find(v => !grammar.variables.includes(v)) || 'X';
    const updatedText = rawGrammarText ? `${rawGrammarText}\n${defaultNextVar} -> a` : `${defaultNextVar} -> a`;
    onTextChange(updatedText);
  };

  const handleDeleteRule = (lhsToDelete: string) => {
    const updatedProductions = grammar.productions.filter(p => p.lhs !== lhsToDelete);
    const updatedText = updatedProductions.map(p => `${p.lhs} -> ${p.rhs.join(' | ')}`).join('\n');
    onTextChange(updatedText);
  };

  const handleUpdateRhs = (lhs: string, newRhsStr: string) => {
    const updatedProductions = grammar.productions.map(p => {
      if (p.lhs === lhs) {
        return {
          ...p,
          rhs: newRhsStr.split('|').map(s => s.trim()).filter(s => s.length > 0)
        };
      }
      return p;
    });
    const updatedText = updatedProductions.map(p => `${p.lhs} -> ${p.rhs.join(' | ')}`).join('\n');
    onTextChange(updatedText);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Grammar Definition & Editor
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Define grammar $G = (V, \Sigma, R, S)$ using standard production syntax (e.g. <code className="text-purple-300 font-mono">S → aA | b</code>)
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-slate-400 font-medium whitespace-nowrap flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            Presets:
          </label>
          <select
            value={selectedSampleId}
            onChange={e => {
              setSelectedSampleId(e.target.value);
              const sample = SAMPLE_GRAMMARS.find(s => s.id === e.target.value);
              if (sample) onLoadSample(sample);
            }}
            className="w-full sm:w-64 bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-lg text-xs text-slate-200 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
          >
            {SAMPLE_GRAMMARS.map(sample => (
              <option key={sample.id} value={sample.id}>
                {sample.name} [{sample.typeBadge}]
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Editor Mode Tabs & Symbol Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setEditorMode('text')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
              editorMode === 'text'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Production Rules (Text)
          </button>
          <button
            onClick={() => setEditorMode('visual')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
              editorMode === 'visual'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            Rule Cards (Visual)
          </button>
        </div>

        {/* Quick Math Symbols */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mr-1">Insert:</span>
          {['→', '|', 'λ', 'ε', 'S', 'A', 'B'].map(sym => (
            <button
              key={sym}
              type="button"
              onClick={() => insertSymbol(sym === '→' ? ' -> ' : sym === '|' ? ' | ' : sym)}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-200 rounded font-mono text-xs transition active:scale-95"
              title={`Insert ${sym}`}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {/* Text Mode Editor */}
      {editorMode === 'text' && (
        <div className="space-y-2">
          <textarea
            value={rawGrammarText}
            onChange={e => onTextChange(e.target.value)}
            rows={5}
            placeholder="S -> aA | b&#10;A -> aS | λ"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm font-mono text-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 resize-y leading-relaxed"
            spellCheck={false}
          />
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <span>Tip: Use <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono">-&gt;</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono">→</kbd> for arrows, <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono">|</kbd> for alternatives, and <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono">λ</kbd>, <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono">ε</kbd>, or <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono">^</kbd> for epsilon.</span>
          </p>
        </div>
      )}

      {/* Visual Mode Editor */}
      {editorMode === 'visual' && (
        <div className="space-y-3">
          {grammar.productions.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">
              No productions defined. Add a production below.
            </div>
          ) : (
            grammar.productions.map(prod => (
              <div
                key={prod.lhs}
                className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-lg border border-slate-800"
              >
                <div className="w-12 text-center font-mono font-bold text-indigo-400 bg-indigo-950/50 border border-indigo-800/60 rounded py-1.5">
                  {prod.lhs}
                </div>
                <span className="text-slate-400 font-mono text-base">→</span>
                <input
                  type="text"
                  value={prod.rhs.join(' | ')}
                  onChange={e => handleUpdateRhs(prod.lhs, e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700/80 rounded px-3 py-1.5 font-mono text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="e.g. aA | b"
                />
                <button
                  onClick={() => handleDeleteRule(prod.lhs)}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition"
                  title={`Delete rule for ${prod.lhs}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}

          <button
            onClick={handleAddRule}
            className="w-full py-2 border border-dashed border-slate-700 hover:border-purple-500 rounded-lg text-xs font-semibold text-slate-400 hover:text-purple-300 flex items-center justify-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            Add Variable Production
          </button>
        </div>
      )}

      {/* Grammar Meta: Variables, Terminals, Start Symbol */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs">
        {/* Variables */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5">
          <div className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider mb-1">
            Variables (V)
          </div>
          <div className="font-mono text-indigo-300 font-semibold flex flex-wrap gap-1">
            {grammar.variables.length > 0 ? (
              grammar.variables.map(v => (
                <span key={v} className="bg-indigo-950 border border-indigo-800/80 px-1.5 py-0.5 rounded">
                  {v}
                </span>
              ))
            ) : (
              <span className="text-slate-400">∅ None</span>
            )}
          </div>
        </div>

        {/* Terminals */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5">
          <div className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider mb-1">
            Alphabet (Σ)
          </div>
          <div className="font-mono text-emerald-300 font-semibold flex flex-wrap gap-1">
            {grammar.terminals.length > 0 ? (
              grammar.terminals.map(t => (
                <span key={t} className="bg-emerald-950 border border-emerald-800/80 px-1.5 py-0.5 rounded">
                  {t}
                </span>
              ))
            ) : (
              <span className="text-slate-400">∅ None</span>
            )}
          </div>
        </div>

        {/* Start Symbol Selector */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5">
          <div className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider mb-1">
            Start Symbol (S)
          </div>
          {grammar.variables.length > 0 ? (
            <select
              value={grammar.startSymbol}
              onChange={e => handleStartSymbolChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-purple-300 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 font-bold"
            >
              {grammar.variables.map(v => (
                <option key={v} value={v}>
                  {v} {v === grammar.startSymbol ? '(Current Start)' : ''}
                </option>
              ))}
            </select>
          ) : (
            <span className="font-mono text-slate-400">—</span>
          )}
        </div>
      </div>

      {/* Validation Errors & Warnings */}
      {errors.length > 0 && (
        <div className="bg-red-950/40 border border-red-800/70 rounded-lg p-3 text-xs text-red-200 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-red-400">
            <AlertTriangle className="w-4 h-4" />
            Grammar Syntax Errors ({errors.length})
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-red-300">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && errors.length === 0 && (
        <div className="bg-amber-950/40 border border-amber-800/60 rounded-lg p-3 text-xs text-amber-200 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            Notices & Warnings ({warnings.length})
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-amber-300">
            {warnings.map((warn, i) => (
              <li key={i}>{warn}</li>
            ))}
          </ul>
        </div>
      )}

      {errors.length === 0 && grammar.productions.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900/50 rounded-lg px-3 py-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Syntax valid: Recognized <strong>{grammar.variables.length}</strong> variables, <strong>{grammar.terminals.length}</strong> terminals, and <strong>{grammar.productions.reduce((acc, p) => acc + p.rhs.length, 0)}</strong> total rule alternatives.
          </span>
        </div>
      )}
    </div>
  );
};
