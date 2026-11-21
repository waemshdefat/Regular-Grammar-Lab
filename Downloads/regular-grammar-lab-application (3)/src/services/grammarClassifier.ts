import {
  Grammar,
  GrammarClassificationResult,
  RuleClassification,
  VariableAnalysis,
  LanguageRegularityStatus
} from '../types/grammar';
import { CANONICAL_EPSILON, normalizeEpsilon } from './grammarParser';

/**
 * Extracts variable names occurring in an alternative string.
 */
function extractVariablesFromAlt(alt: string, variables: string[]): string[] {
  const norm = normalizeEpsilon(alt).replace(/\s+/g, '');
  if (norm === CANONICAL_EPSILON || norm === '' || norm === 'ε') {
    return [];
  }
  const matched: string[] = [];
  const sorted = [...variables].sort((a, b) => b.length - a.length);

  let i = 0;
  while (i < norm.length) {
    let found: string | null = null;
    for (const v of sorted) {
      if (norm.startsWith(v, i)) {
        found = v;
        break;
      }
    }
    if (!found && /[A-Z]/.test(norm[i])) {
      const sub = norm.slice(i);
      const m = sub.match(/^[A-Z][0-9_']*/);
      found = m ? m[0] : norm[i];
    }
    if (found) {
      matched.push(found);
      i += found.length;
    } else {
      i++;
    }
  }
  return matched;
}

/**
 * Performs Reachability and Generation Analysis (Detects Unreachable, Non-Generating variables, and Empty Language).
 */
export function analyzeVariables(grammar: Grammar): VariableAnalysis {
  const allVars = new Set<string>(grammar.variables);
  const start = grammar.startSymbol;

  // 1. Generating variables (Variables that can derive terminal strings: A =>* w in Sigma*)
  const generating = new Set<string>();
  let changed = true;

  while (changed) {
    changed = false;
    for (const prod of grammar.productions) {
      if (generating.has(prod.lhs)) continue;

      for (const alt of prod.rhs) {
        const varsInAlt = extractVariablesFromAlt(alt, grammar.variables);
        // If all variables appearing in this RHS are already known to be generating
        const allInGenerating = varsInAlt.every(v => generating.has(v));
        if (allInGenerating) {
          generating.add(prod.lhs);
          changed = true;
          break;
        }
      }
    }
  }

  // Non-generating variables
  const nonGenerating = Array.from(allVars).filter(v => !generating.has(v)).sort();

  // 2. Reachable variables (Variables reachable from the start symbol: S =>* alpha A beta)
  const reachable = new Set<string>();
  if (start && allVars.has(start)) {
    const queue = [start];
    reachable.add(start);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const prod = grammar.productions.find(p => p.lhs === curr);
      if (!prod) continue;

      for (const alt of prod.rhs) {
        const varsInAlt = extractVariablesFromAlt(alt, grammar.variables);
        for (const v of varsInAlt) {
          if (!reachable.has(v)) {
            reachable.add(v);
            queue.push(v);
          }
        }
      }
    }
  }

  // Unreachable variables
  const unreachable = Array.from(allVars).filter(v => !reachable.has(v)).sort();

  // 3. Empty language: if start symbol cannot generate any terminal string, L(G) is empty
  const isEmptyLanguage = !start || !generating.has(start);

  return {
    generatingVariables: Array.from(generating).sort(),
    nonGeneratingVariables: nonGenerating,
    reachableVariables: Array.from(reachable).sort(),
    unreachableVariables: unreachable,
    isEmptyLanguage
  };
}

/**
 * Checks whether the grammar has any recursive variable cycles (used for finite language detection).
 */
function isGrammarFinite(grammar: Grammar, reachableVars: Set<string>): boolean {
  // Directed dependency graph among reachable variables
  const adj = new Map<string, Set<string>>();
  for (const v of reachableVars) {
    adj.set(v, new Set());
  }

  for (const prod of grammar.productions) {
    if (!reachableVars.has(prod.lhs)) continue;
    const targets = adj.get(prod.lhs)!;
    for (const alt of prod.rhs) {
      const vars = extractVariablesFromAlt(alt, grammar.variables);
      for (const v of vars) {
        if (reachableVars.has(v)) {
          targets.add(v);
        }
      }
    }
  }

  // Cycle detection in directed graph
  const visited = new Map<string, number>(); // 0=unvisited, 1=visiting, 2=visited
  for (const v of reachableVars) visited.set(v, 0);

  function hasCycle(node: string): boolean {
    visited.set(node, 1);
    const neighbors = adj.get(node) || new Set();
    for (const n of neighbors) {
      if (visited.get(n) === 1) return true;
      if (visited.get(n) === 0 && hasCycle(n)) return true;
    }
    visited.set(node, 2);
    return false;
  }

  for (const v of reachableVars) {
    if (visited.get(v) === 0) {
      if (hasCycle(v)) return false; // Cycle exists => potentially infinite
    }
  }

  return true; // Acyclic graph among reachable variables => finite language
}

/**
 * Classifies an individual RHS alternative of a production A -> rhs.
 */
export function classifyAlternative(
  lhs: string,
  alt: string,
  variables: string[]
): RuleClassification {
  const normAlt = normalizeEpsilon(alt);
  const ruleStr = `${lhs} → ${normAlt}`;

  if (normAlt === CANONICAL_EPSILON || normAlt === '' || normAlt === 'ε') {
    return {
      ruleStr,
      lhs,
      rhsPart: normAlt,
      category: 'EPSILON',
      explanation: `Epsilon (λ) production: valid in both Right-Linear and Left-Linear grammars.`
    };
  }

  const cleanAlt = alt.replace(/\s+/g, '');
  const varMatches: { varToken: string; start: number; end: number }[] = [];
  const sortedVars = [...variables].sort((a, b) => b.length - a.length);

  let i = 0;
  while (i < cleanAlt.length) {
    let matchedVar: string | null = null;
    for (const v of sortedVars) {
      if (cleanAlt.startsWith(v, i)) {
        matchedVar = v;
        break;
      }
    }

    if (!matchedVar && /[A-Z]/.test(cleanAlt[i])) {
      const sub = cleanAlt.slice(i);
      const m = sub.match(/^[A-Z][0-9_']*/);
      matchedVar = m ? m[0] : cleanAlt[i];
    }

    if (matchedVar) {
      varMatches.push({
        varToken: matchedVar,
        start: i,
        end: i + matchedVar.length
      });
      i += matchedVar.length;
    } else {
      i++;
    }
  }

  // Case 1: No variables in RHS (terminal-only)
  if (varMatches.length === 0) {
    return {
      ruleStr,
      lhs,
      rhsPart: normAlt,
      category: 'TERMINAL_ONLY',
      explanation: `Terminal-only production (A → x): Compatible with both Right-Linear and Left-Linear forms.`
    };
  }

  // Case 2: Exactly one variable
  if (varMatches.length === 1) {
    const vMatch = varMatches[0];
    const isAtStart = vMatch.start === 0;
    const isAtEnd = vMatch.end === cleanAlt.length;

    // Subcase 2.1: Single variable alone (Unit production A → B)
    if (isAtStart && isAtEnd) {
      return {
        ruleStr,
        lhs,
        rhsPart: normAlt,
        category: 'UNIT_PRODUCTION',
        explanation: `Unit production (A → B): single non-terminal variable, valid in both Right-Linear and Left-Linear grammars.`
      };
    }

    // Subcase 2.2: Variable strictly at right end (A → xB)
    if (isAtEnd && !isAtStart) {
      const terminalPrefix = cleanAlt.substring(0, vMatch.start);
      return {
        ruleStr,
        lhs,
        rhsPart: normAlt,
        category: 'RIGHT_LINEAR',
        explanation: `Right-Linear form (A → xB): variable "${vMatch.varToken}" appears at the rightmost end after terminal sequence "${terminalPrefix}".`
      };
    }

    // Subcase 2.3: Variable strictly at left start (A → Bx)
    if (isAtStart && !isAtEnd) {
      const terminalSuffix = cleanAlt.substring(vMatch.end);
      return {
        ruleStr,
        lhs,
        rhsPart: normAlt,
        category: 'LEFT_LINEAR',
        explanation: `Left-Linear form (A → Bx): variable "${vMatch.varToken}" appears at the leftmost start before terminal sequence "${terminalSuffix}".`
      };
    }

    // Subcase 2.4: Variable in the middle flanked by terminals on both sides: A → u B v
    return {
      ruleStr,
      lhs,
      rhsPart: normAlt,
      category: 'NON_LINEAR',
      explanation: `Non-Regular Linear form (A → uBv): variable "${vMatch.varToken}" is flanked on both sides by terminals.`
    };
  }

  // Case 3: More than one variable (Context-Free)
  const varNames = varMatches.map(m => m.varToken).join(', ');
  return {
    ruleStr,
    lhs,
    rhsPart: normAlt,
    category: 'NON_LINEAR',
    explanation: `Context-Free form: RHS contains ${varMatches.length} variables (${varNames}). Regular grammars permit at most one variable on the RHS.`
  };
}

/**
 * Classifies a full grammar according to formal language theory,
 * rigorously distinguishing between Grammar Form and Generated Language Regularity.
 */
export function classifyGrammar(grammar: Grammar): GrammarClassificationResult {
  const emptyAnalysis: VariableAnalysis = {
    generatingVariables: [],
    nonGeneratingVariables: [],
    reachableVariables: [],
    unreachableVariables: [],
    isEmptyLanguage: true
  };

  if (!grammar.productions || grammar.productions.length === 0) {
    return {
      type: 'INVALID',
      typeName: 'Empty Grammar',
      isRegular: false,
      isRightLinear: false,
      isLeftLinear: false,
      isLinear: false,
      ruleBreakdown: [],
      summary: 'The grammar has no production rules.',
      notes: ['Please define at least one production rule.'],
      variableAnalysis: emptyAnalysis,
      languageStatus: 'EMPTY_LANGUAGE',
      languageDistinctionNote: 'An empty grammar generates L(G) = ∅, which is formally a regular language (the empty language is regular), though the grammar is empty.'
    };
  }

  const variableAnalysis = analyzeVariables(grammar);
  const ruleBreakdown: RuleClassification[] = [];
  let hasRightLinear = false;
  let hasLeftLinear = false;
  let hasNonLinear = false;

  for (const prod of grammar.productions) {
    for (const alt of prod.rhs) {
      const classification = classifyAlternative(prod.lhs, alt, grammar.variables);
      ruleBreakdown.push(classification);

      if (classification.category === 'RIGHT_LINEAR') {
        hasRightLinear = true;
      } else if (classification.category === 'LEFT_LINEAR') {
        hasLeftLinear = true;
      } else if (classification.category === 'NON_LINEAR' || classification.category === 'INVALID') {
        hasNonLinear = true;
      }
    }
  }

  // Notes on unreachable and non-generating variables
  const structuralNotes: string[] = [];
  if (variableAnalysis.unreachableVariables.length > 0) {
    structuralNotes.push(`Unreachable variable(s): { ${variableAnalysis.unreachableVariables.join(', ')} }. They cannot be reached from start symbol "${grammar.startSymbol}".`);
  }
  if (variableAnalysis.nonGeneratingVariables.length > 0) {
    structuralNotes.push(`Non-generating variable(s): { ${variableAnalysis.nonGeneratingVariables.join(', ')} }. They cannot derive any string of terminals.`);
  }

  // Empty language check
  if (variableAnalysis.isEmptyLanguage) {
    structuralNotes.push(`Start symbol "${grammar.startSymbol}" cannot derive any terminal string. The language is empty: L(G) = ∅.`);
  }

  // Check if language is provably finite
  const isFinite = isGrammarFinite(grammar, new Set(variableAnalysis.reachableVariables));

  // 1. Context-Free (Multi-variable or flanked)
  if (hasNonLinear) {
    const isFiniteRegular = isFinite && !variableAnalysis.isEmptyLanguage;
    const languageStatus: LanguageRegularityStatus = variableAnalysis.isEmptyLanguage
      ? 'EMPTY_LANGUAGE'
      : isFiniteRegular
      ? 'PROVABLY_FINITE_REGULAR'
      : 'UNDECIDABLE_GENERAL_CFG';

    const distinctionNote = isFiniteRegular
      ? 'CRITICAL DISTINCTION: While the grammar rules are syntactically Context-Free (e.g. S → AB), all reachable variables terminate without cycles, deriving a strictly finite set of strings. In Formal Languages, every finite language is provably REGULAR! Thus, grammar syntax is Context-Free, but the generated language L(G) is regular.'
      : variableAnalysis.isEmptyLanguage
      ? 'The grammar syntax is Context-Free, but the start symbol does not generate any terminal string, so L(G) = ∅, which is trivially regular.'
      : 'CRITICAL DISTINCTION: This grammar has Context-Free syntax. In general, deciding whether an arbitrary CFG generates a regular language is mathematically UNDECIDABLE (by Greibach\'s Theorem / Rice\'s Theorem for CFLs). For specific recursive patterns like S → aSb | λ, L(G) = { aⁿbⁿ } is proven non-regular by the Pumping Lemma.';

    return {
      type: 'CONTEXT_FREE',
      typeName: 'Context-Free (Non-Regular Form)',
      isRegular: false,
      isRightLinear: false,
      isLeftLinear: false,
      isLinear: false,
      ruleBreakdown,
      summary: 'This grammar is syntactically Context-Free. It contains rules with multiple variables on the RHS or variables flanked on both sides by terminals.',
      notes: [
        'Regular grammars require all productions to be strictly one-sided linear (A → xB or A → Bx).',
        'Direct NFA conversion requires regular production form (Type-3).',
        ...structuralNotes
      ],
      limitations: 'Direct standard NFA construction requires right-linear or left-linear regular production form. Standard NFAs have finite states and cannot store unbounded memory counters.',
      variableAnalysis,
      languageStatus,
      languageDistinctionNote: distinctionNote
    };
  }

  // 2. Mixed Linear
  if (hasRightLinear && hasLeftLinear) {
    const isFiniteRegular = isFinite && !variableAnalysis.isEmptyLanguage;
    const languageStatus: LanguageRegularityStatus = variableAnalysis.isEmptyLanguage
      ? 'EMPTY_LANGUAGE'
      : isFiniteRegular
      ? 'PROVABLY_FINITE_REGULAR'
      : 'POTENTIALLY_NON_REGULAR';

    const distinctionNote = isFiniteRegular
      ? 'CRITICAL DISTINCTION: The grammar mixes Right-Linear and Left-Linear production rules, but contains no cycles, generating a finite language. Since every finite language is Regular, L(G) is regular, even though the grammar is not in standard regular form.'
      : 'CRITICAL DISTINCTION: The grammar is syntactically Mixed Linear. By definition (Chomsky Type-3), a Regular Grammar must be uniformly Right-Linear OR uniformly Left-Linear. When recursive, mixed linear rules can synchronize left and right expansions to generate non-regular languages such as { aⁿbⁿ } (e.g. S → aA, A → Sb).';

    return {
      type: 'LINEAR',
      typeName: 'Mixed Linear Grammar',
      isRegular: false,
      isRightLinear: false,
      isLeftLinear: false,
      isLinear: true,
      ruleBreakdown,
      summary: 'This grammar is Linear, but not a standard Regular Grammar because it mixes Right-Linear (A → xB) and Left-Linear (A → Bx) productions.',
      notes: [
        'A regular grammar must have a uniform direction (consistently right-linear or consistently left-linear).',
        'Direct conversion requires transforming the grammar into a single uniform direction.',
        ...structuralNotes
      ],
      limitations: 'Direct NFA conversion is withheld for mixed linear grammars because directionality is contradictory. Decompose into uniform form before converting.',
      variableAnalysis,
      languageStatus,
      languageDistinctionNote: distinctionNote
    };
  }

  // 3. Right-Linear
  if (hasRightLinear && !hasLeftLinear) {
    return {
      type: 'RIGHT_LINEAR',
      typeName: 'Right-Linear Grammar (Regular)',
      isRegular: true,
      isRightLinear: true,
      isLeftLinear: false,
      isLinear: true,
      ruleBreakdown,
      summary: 'All productions conform to the standard Right-Linear format (A → xB, A → x, A → B, or A → λ).',
      notes: [
        'This grammar is fully Regular (Chomsky Type-3).',
        'Directly convertible to an NFA where variables correspond to states.',
        'Generates a Regular Language L(G).',
        ...structuralNotes
      ],
      variableAnalysis,
      languageStatus: variableAnalysis.isEmptyLanguage ? 'EMPTY_LANGUAGE' : 'PROVABLY_REGULAR',
      languageDistinctionNote: variableAnalysis.isEmptyLanguage
        ? 'The grammar is in Right-Linear regular form, but the start symbol is non-generating, producing the empty language L(G) = ∅ (which is trivially regular).'
        : 'Both the grammar syntax and the generated language are Regular (Chomsky Type-3). Direct variable-to-state NFA conversion preserves L(G).'
    };
  }

  // 4. Left-Linear
  if (hasLeftLinear && !hasRightLinear) {
    return {
      type: 'LEFT_LINEAR',
      typeName: 'Left-Linear Grammar (Regular)',
      isRegular: true,
      isRightLinear: false,
      isLeftLinear: true,
      isLinear: true,
      ruleBreakdown,
      summary: 'All productions conform to the standard Left-Linear format (A → Bx, A → x, A → B, or A → λ).',
      notes: [
        'This grammar is fully Regular (Chomsky Type-3).',
        'Directly convertible to an NFA using the Left-Linear dual construction algorithm.',
        'Generates a Regular Language L(G).',
        ...structuralNotes
      ],
      variableAnalysis,
      languageStatus: variableAnalysis.isEmptyLanguage ? 'EMPTY_LANGUAGE' : 'PROVABLY_REGULAR',
      languageDistinctionNote: variableAnalysis.isEmptyLanguage
        ? 'The grammar is in Left-Linear regular form, but the start symbol is non-generating, producing the empty language L(G) = ∅ (which is trivially regular).'
        : 'Both the grammar syntax and the generated language are Regular (Chomsky Type-3). The Left-Linear dual algorithm constructs an NFA accepting L(G) reading left-to-right.'
    };
  }

  // 5. Terminal-only, unit, or epsilon productions (Finite language or trivial)
  return {
    type: 'RIGHT_LINEAR',
    typeName: 'Regular Grammar (Finite Language)',
    isRegular: true,
    isRightLinear: true,
    isLeftLinear: true,
    isLinear: true,
    ruleBreakdown,
    summary: 'All productions are terminal-only (A → x), unit (A → B), or epsilon (A → λ). Trivially both Right-Linear and Left-Linear.',
    notes: [
      'This grammar generates a finite regular language.',
      'Fully convertible to an NFA using either Right-Linear or Left-Linear construction.',
      ...structuralNotes
    ],
    variableAnalysis,
    languageStatus: variableAnalysis.isEmptyLanguage ? 'EMPTY_LANGUAGE' : 'PROVABLY_FINITE_REGULAR',
    languageDistinctionNote: 'All rules contain at most terminals or unit transfers without directionality conflicts. The language is finite, hence regular.'
  };
}
