import { DerivationStep, GeneratedString, Grammar } from '../types/grammar';
import { CANONICAL_EPSILON, normalizeEpsilon } from './grammarParser';

interface QueueItem {
  sententialForm: string;
  history: DerivationStep[];
  depth: number;
}

/**
 * Generates strings in L(G) using BFS with cycle and depth limits.
 */
export function generateStringsFromGrammar(
  grammar: Grammar,
  maxDepth = 7,
  maxStrings = 20
): GeneratedString[] {
  if (!grammar.startSymbol || grammar.productions.length === 0) {
    return [];
  }

  const results: GeneratedString[] = [];
  const visitedForms = new Set<string>();
  const producedStrings = new Set<string>();

  const queue: QueueItem[] = [
    {
      sententialForm: grammar.startSymbol,
      history: [],
      depth: 0
    }
  ];

  visitedForms.add(grammar.startSymbol);

  // Sort variables by length descending to match multi-char variables first
  const sortedVars = [...grammar.variables].sort((a, b) => b.length - a.length);

  while (queue.length > 0 && results.length < maxStrings) {
    const { sententialForm, history, depth } = queue.shift()!;

    // Check if current form is purely terminal
    const hasVariables = sortedVars.some(v => sententialForm.includes(v));

    if (!hasVariables) {
      const cleanStr = sententialForm === '' ? CANONICAL_EPSILON : sententialForm;
      if (!producedStrings.has(cleanStr)) {
        producedStrings.add(cleanStr);
        results.push({
          str: cleanStr,
          length: cleanStr === CANONICAL_EPSILON ? 0 : cleanStr.length,
          derivation: history,
          rulesUsed: history.map(h => h.ruleApplied)
        });
      }
      continue;
    }

    if (depth >= maxDepth) {
      continue;
    }

    // Find leftmost variable
    let leftmostVar: string | null = null;
    let leftmostIndex = Infinity;

    for (const v of sortedVars) {
      const idx = sententialForm.indexOf(v);
      if (idx !== -1 && idx < leftmostIndex) {
        leftmostIndex = idx;
        leftmostVar = v;
      }
    }

    if (!leftmostVar) continue;

    const prod = grammar.productions.find(p => p.lhs === leftmostVar);
    if (!prod) continue;

    for (const alt of prod.rhs) {
      const normAlt = normalizeEpsilon(alt);
      const replacement = (normAlt === CANONICAL_EPSILON || normAlt === 'ε') ? '' : normAlt;
      const nextForm =
        sententialForm.substring(0, leftmostIndex) +
        replacement +
        sententialForm.substring(leftmostIndex + leftmostVar.length);

      const step: DerivationStep = {
        sententialForm,
        replacedVariable: leftmostVar,
        ruleApplied: `${leftmostVar} → ${normAlt}`,
        indexInString: leftmostIndex,
        nextForm: nextForm === '' ? CANONICAL_EPSILON : nextForm
      };

      const key = `${nextForm}#${depth + 1}`;
      if (!visitedForms.has(key)) {
        visitedForms.add(key);
        queue.push({
          sententialForm: nextForm,
          history: [...history, step],
          depth: depth + 1
        });
      }
    }
  }

  // Sort by string length ascending, then alphabetically
  return results.sort((a, b) => a.length - b.length || a.str.localeCompare(b.str));
}

/**
 * Finds a derivation for a specific target string if reachable within search limit.
 */
export function findDerivationForString(
  grammar: Grammar,
  targetString: string,
  maxSteps = 3000
): DerivationStep[] | null {
  const normInput = normalizeEpsilon(targetString.trim());
  const target = normInput === CANONICAL_EPSILON ? '' : normInput;

  const queue: QueueItem[] = [
    {
      sententialForm: grammar.startSymbol,
      history: [],
      depth: 0
    }
  ];
  const visited = new Set<string>();
  let stepsCount = 0;

  const sortedVars = [...grammar.variables].sort((a, b) => b.length - a.length);

  while (queue.length > 0 && stepsCount < maxSteps) {
    stepsCount++;
    const { sententialForm, history, depth } = queue.shift()!;

    if (sententialForm === target) {
      return history;
    }

    if (depth > 20) continue;

    // Prune forms that are excessively long compared to target
    if (sententialForm.length > target.length + 8) {
      continue;
    }

    let leftmostVar: string | null = null;
    let leftmostIndex = Infinity;

    for (const v of sortedVars) {
      const idx = sententialForm.indexOf(v);
      if (idx !== -1 && idx < leftmostIndex) {
        leftmostIndex = idx;
        leftmostVar = v;
      }
    }

    if (!leftmostVar) continue;

    const prod = grammar.productions.find(p => p.lhs === leftmostVar);
    if (!prod) continue;

    for (const alt of prod.rhs) {
      const normAlt = normalizeEpsilon(alt);
      const replacement = (normAlt === CANONICAL_EPSILON || normAlt === 'ε') ? '' : normAlt;
      const nextForm =
        sententialForm.substring(0, leftmostIndex) +
        replacement +
        sententialForm.substring(leftmostIndex + leftmostVar.length);

      const step: DerivationStep = {
        sententialForm,
        replacedVariable: leftmostVar,
        ruleApplied: `${leftmostVar} → ${normAlt}`,
        indexInString: leftmostIndex,
        nextForm: nextForm === '' ? CANONICAL_EPSILON : nextForm
      };

      const key = `${nextForm}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({
          sententialForm: nextForm,
          history: [...history, step],
          depth: depth + 1
        });
      }
    }
  }

  return null;
}
