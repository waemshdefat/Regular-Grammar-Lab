import { Grammar, GrammarClassificationResult, RuleClassification } from '../types/grammar';
import { CANONICAL_EPSILON, normalizeEpsilon } from './grammarParser';

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

  // Remove internal whitespace when analyzing token positions (e.g. "a B" -> "aB")
  const cleanAlt = alt.replace(/\s+/g, '');

  // Count and locate variables in RHS
  const varMatches: { varToken: string; start: number; end: number }[] = [];
  
  // Sort variables by length descending to match multi-char vars like A1 or S0 before single letters
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
      // Fallback undeclared variable pattern (uppercase followed by digits/primes)
      const sub = cleanAlt.slice(i);
      const m = sub.match(/^[A-Z][0-9_']*/);
      if (m) {
        matchedVar = m[0];
      } else {
        matchedVar = cleanAlt[i];
      }
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
      explanation: `Non-Regular Linear form (A → uBv): variable "${vMatch.varToken}" is flanked on both sides by terminals. Cannot be simulated by a regular finite automaton.`
    };
  }

  // Case 3: More than one variable (Context-Free)
  const varNames = varMatches.map(m => m.varToken).join(', ');
  return {
    ruleStr,
    lhs,
    rhsPart: normAlt,
    category: 'NON_LINEAR',
    explanation: `Context-Free form: RHS contains ${varMatches.length} variables (${varNames}). Regular grammars permit at most one variable on the right-hand side.`
  };
}

/**
 * Classify a full grammar as Right-Linear, Left-Linear, Linear (mixed), or Context-Free.
 */
export function classifyGrammar(grammar: Grammar): GrammarClassificationResult {
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
      notes: ['Please define at least one production rule.']
    };
  }

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

  // Evaluation of the full grammar
  if (hasNonLinear) {
    return {
      type: 'CONTEXT_FREE',
      typeName: 'Context-Free (Non-Regular)',
      isRegular: false,
      isRightLinear: false,
      isLeftLinear: false,
      isLinear: false,
      ruleBreakdown,
      summary: 'This grammar is Context-Free but NOT Regular. It contains rules with multiple variables or variables flanked by terminals on both sides.',
      notes: [
        'Regular grammars allow at most one non-terminal variable on the right-hand side of any production.',
        'Productions like S → aSb or S → AB cannot be directly represented as finite state automata without stack memory.'
      ],
      limitations: 'Direct conversion to NFA is not supported for non-regular context-free grammars because standard NFAs have finite states and cannot store unbounded memory counts.'
    };
  }

  if (hasRightLinear && hasLeftLinear) {
    return {
      type: 'LINEAR',
      typeName: 'Mixed Linear Grammar (Non-Regular)',
      isRegular: false,
      isRightLinear: false,
      isLeftLinear: false,
      isLinear: true,
      ruleBreakdown,
      summary: 'This grammar is Linear, but NOT a Regular Grammar because it mixes Right-Linear (A → xB) and Left-Linear (A → Bx) productions.',
      notes: [
        'By formal definition (Hopcroft & Ullman), a Regular Grammar must be uniformly Right-Linear OR uniformly Left-Linear.',
        'Mixing both directions allows grammars to simulate non-regular counting behaviors such as generating { aⁿbⁿ } (e.g. S → aA, A → Sb | λ).',
        'Standard regular grammar to NFA conversion algorithms cannot proceed when directionality is mixed.'
      ],
      limitations: 'Mixed linear grammars require manual decomposition or language equivalence proofs to determine if the generated language is regular.'
    };
  }

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
        'Directly convertible to a Non-deterministic Finite Automaton (NFA) where variables correspond to states.',
        'Generates a Regular Language L(G).'
      ]
    };
  }

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
        'Left-linear grammars generate regular languages, isomorphic to reading the language in reverse.',
        'Directly convertible to an NFA via the Left-Linear dual construction algorithm.'
      ]
    };
  }

  // Only terminal-only, epsilon, or unit productions (finite language)
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
      'Fully convertible to an NFA using either Right-Linear or Left-Linear construction.'
    ]
  };
}
