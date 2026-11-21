import React from 'react';
import { GrammarClassificationResult } from '../../types/grammar';
import { CheckCircle2, XCircle, AlertCircle, HelpCircle, Layers, ArrowRight } from 'lucide-react';

interface ClassificationViewProps {
  classification: GrammarClassificationResult;
  onNavigateToAutomaton?: () => void;
}

export const ClassificationView: React.FC<ClassificationViewProps> = ({
  classification,
  onNavigateToAutomaton
}) => {
  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'RIGHT_LINEAR':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'LEFT_LINEAR':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'LINEAR':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-red-500/20 text-red-300 border-red-500/40';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
      {/* Classification Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">Grammar Classification Analyzer</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluates adherence to Chomsky Type-3 (Regular Grammar) criteria
          </p>
        </div>

        {/* Primary Status Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${getBadgeColor(
              classification.type
            )}`}
          >
            {classification.isRegular ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400" />
            )}
            {classification.typeName}
          </span>
        </div>
      </div>

      {/* Summary Box */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-start gap-3">
          {classification.isRegular ? (
            <div className="p-2 bg-emerald-950/60 border border-emerald-800/80 rounded-lg text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          ) : (
            <div className="p-2 bg-amber-950/60 border border-amber-800/80 rounded-lg text-amber-400 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
          )}
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white">
              {classification.summary}
            </h3>
            <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
              {classification.notes.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Action Link to NFA */}
        {classification.isRegular && onNavigateToAutomaton && (
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-emerald-400">
              ✓ Ready for conversion to Non-deterministic Finite Automaton (NFA) [{classification.isLeftLinear ? 'Left-Linear Dual' : 'Right-Linear Standard'}].
            </span>
            <button
              onClick={onNavigateToAutomaton}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
            >
              View Generated NFA <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Limitation Explanation for Non-Right-Linear */}
        {classification.limitations && (
          <div className="p-3 bg-slate-900/90 border border-amber-800/40 rounded-lg text-xs text-amber-300 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Theoretical Limitation: </strong>
              {classification.limitations}
            </div>
          </div>
        )}
      </div>

      {/* Breakdown Table */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Rule-by-Rule Structural Breakdown ({classification.ruleBreakdown.length} rules)
        </h3>
        <div className="border border-slate-800 rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Production Rule</th>
                <th className="py-2.5 px-3">Detected Form</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Theoretical Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 font-mono">
              {classification.ruleBreakdown.map((rule, idx) => {
                let badgeClass = 'text-slate-300 bg-slate-800';
                if (rule.category === 'RIGHT_LINEAR') {
                  badgeClass = 'text-emerald-300 bg-emerald-950/80 border border-emerald-800/60';
                } else if (rule.category === 'LEFT_LINEAR') {
                  badgeClass = 'text-blue-300 bg-blue-950/80 border border-blue-800/60';
                } else if (rule.category === 'TERMINAL_ONLY') {
                  badgeClass = 'text-cyan-300 bg-cyan-950/80 border border-cyan-800/60';
                } else if (rule.category === 'UNIT_PRODUCTION') {
                  badgeClass = 'text-amber-300 bg-amber-950/80 border border-amber-800/60';
                } else if (rule.category === 'EPSILON') {
                  badgeClass = 'text-purple-300 bg-purple-950/80 border border-purple-800/60';
                } else {
                  badgeClass = 'text-red-300 bg-red-950/80 border border-red-800/60';
                }

                return (
                  <tr key={idx} className="hover:bg-slate-950/50 transition">
                    <td className="py-2.5 px-3 text-purple-300 font-bold whitespace-nowrap">
                      {rule.ruleStr}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-sans text-xs">
                      {rule.category === 'RIGHT_LINEAR' && 'A → xB'}
                      {rule.category === 'LEFT_LINEAR' && 'A → Bx'}
                      {rule.category === 'UNIT_PRODUCTION' && 'A → B'}
                      {rule.category === 'TERMINAL_ONLY' && 'A → x'}
                      {rule.category === 'EPSILON' && 'A → λ'}
                      {rule.category === 'NON_LINEAR' && 'A → uBv / Multi-Var'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-sans font-medium ${badgeClass}`}>
                        {rule.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-300 text-xs">
                      {rule.explanation}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
