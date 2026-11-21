import { Grammar, ProductionRule } from '../types/grammar';

export const EPSILON_SYMBOLS = ['λ', 'ε', '\\lambda', '\\epsilon', 'lambda', 'epsilon', '^', 'e'];
export const CANONICAL_EPSILON = 'λ';

/**
 * Normalizes epsilon representations to the canonical λ
 */
export function normalizeEpsilon(text: string): string {
  if (!text) return CANONICAL_EPSILON;
  const res = text.trim();
  if (EPSILON_SYMBOLS.includes(res) || EPSILON_SYMBOLS.includes(res.toLowerCase())) {
    return CANONICAL_EPSILON;
  }
  return res;
}

/**
 * Determines whether a character/token represents a non-terminal (variable).
 * In formal CS convention, uppercase letters (optionally followed by digits/primes) are variables: S, A, B, A1, S0, T', etc.
 */
export function isVariableToken(token: string): boolean {
  if (!token) return false;
  return /^[A-Z][0-9_']*$/.test(token.trim());
}

/**
 * Parse multiline string grammar representation into Grammar structure.
 * Supports syntax like:
 * S -> aA | b
 * A -> aS | λ
 */
export function parseGrammarFromText(rawText: string, customStart?: string): {
  grammar: Grammar;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('//') && !l.startsWith('#'));

  if (lines.length === 0) {
    return {
      grammar: { variables: [], terminals: [], productions: [], startSymbol: '' },
      errors: ['No production rules provided. Grammar cannot be empty.'],
      warnings: []
    };
  }

  const productionMap = new Map<string, string[]>();
  const declaredVariables = new Set<string>();
  let firstLhs = '';

  // Pass 1: Parse and validate lines and LHS variables
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const arrowMatch = line.match(/^([^->:=]+)\s*(?:->|→|:=|:)\s*(.*)$/);

    if (!arrowMatch) {
      errors.push(`Line ${idx + 1}: Invalid format "${line}". Expected format like "S -> aA | b" or "S → aA | b".`);
      continue;
    }

    const lhs = arrowMatch[1].trim();
    const rhsString = arrowMatch[2].trim();

    if (!lhs) {
      errors.push(`Line ${idx + 1}: Left-hand side variable is missing.`);
      continue;
    }

    if (lhs.split(/\s+/).length > 1 || !isVariableToken(lhs)) {
      errors.push(`Line ${idx + 1}: LHS "${lhs}" must be a single non-terminal variable (e.g. S, A, B, A1).`);
      continue;
    }

    if (!firstLhs) {
      firstLhs = lhs;
    }

    declaredVariables.add(lhs);

    // Split alternatives by |
    const rawAlternatives = rhsString.split('|');
    const alternatives: string[] = [];

    for (const rawAlt of rawAlternatives) {
      const trimmed = rawAlt.trim();
      if (trimmed.length === 0) {
        // If RHS is empty or ends with trailing |, it is either an error or intended as epsilon
        warnings.push(`Line ${idx + 1}: Empty alternative detected for "${lhs}". If intended as epsilon, use "λ" or "ε".`);
        alternatives.push(CANONICAL_EPSILON);
      } else {
        const norm = normalizeEpsilon(trimmed);
        alternatives.push(norm);
      }
    }

    if (alternatives.length === 0) {
      errors.push(`Line ${idx + 1}: Right-hand side for "${lhs}" cannot be empty.`);
      continue;
    }

    const currentAlts = productionMap.get(lhs) || [];
    for (const alt of alternatives) {
      if (!currentAlts.includes(alt)) {
        currentAlts.push(alt);
      }
    }
    productionMap.set(lhs, currentAlts);
  }

  // Pass 2: Extract variables and terminals across all RHS alternatives
  const allVariables = new Set<string>(declaredVariables);
  const terminals = new Set<string>();

  // Sort declared variables by length descending to match e.g. "A1" before "A"
  const sortedDeclared = Array.from(declaredVariables).sort((a, b) => b.length - a.length);

  productionMap.forEach((rhsList, lhs) => {
    for (const alt of rhsList) {
      if (alt === CANONICAL_EPSILON) continue;

      let i = 0;
      while (i < alt.length) {
        if (alt[i] === ' ' || alt[i] === '\t') {
          i++;
          continue;
        }

        // Try matching a declared variable
        let matchedDeclared: string | null = null;
        for (const v of sortedDeclared) {
          if (alt.startsWith(v, i)) {
            // Verify token boundary: if v is single uppercase like "A" and next char is digit like "1", but "A1" wasn't declared
            matchedDeclared = v;
            break;
          }
        }

        if (matchedDeclared) {
          allVariables.add(matchedDeclared);
          i += matchedDeclared.length;
          continue;
        }

        // Check if starting an undeclared variable (uppercase letter followed by digits/primes)
        const sub = alt.slice(i);
        const undeclaredVarMatch = sub.match(/^[A-Z][0-9_']*/);
        if (undeclaredVarMatch) {
          const varToken = undeclaredVarMatch[0];
          allVariables.add(varToken);
          warnings.push(`Variable "${varToken}" appears on the RHS of "${lhs} -> ${alt}" but has no production rules defined.`);
          i += varToken.length;
          continue;
        }

        // Otherwise, it's a terminal symbol character
        const char = alt[i];
        if (char !== CANONICAL_EPSILON && char !== 'ε') {
          terminals.add(char);
        }
        i++;
      }
    }
  });

  const productions: ProductionRule[] = Array.from(productionMap.entries()).map(([lhs, rhs], index) => ({
    id: `rule-${index + 1}`,
    lhs,
    rhs
  }));

  const startSymbol = customStart && allVariables.has(customStart)
    ? customStart
    : (firstLhs || (allVariables.size > 0 ? Array.from(allVariables)[0] : 'S'));

  return {
    grammar: {
      variables: Array.from(allVariables).sort(),
      terminals: Array.from(terminals).sort(),
      productions,
      startSymbol
    },
    errors,
    warnings
  };
}

/**
 * Format a grammar into human-readable standard production lines.
 */
export function formatGrammarToText(grammar: Grammar): string {
  if (!grammar.productions || grammar.productions.length === 0) return '';
  // Put start symbol first
  const sorted = [...grammar.productions].sort((a, b) => {
    if (a.lhs === grammar.startSymbol) return -1;
    if (b.lhs === grammar.startSymbol) return 1;
    return a.lhs.localeCompare(b.lhs);
  });

  return sorted.map(p => `${p.lhs} → ${p.rhs.join(' | ')}`).join('\n');
}
