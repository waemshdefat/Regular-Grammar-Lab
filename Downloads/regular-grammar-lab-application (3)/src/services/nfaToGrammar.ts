import { Grammar, NFA, ProductionRule } from '../types/grammar';
import { CANONICAL_EPSILON } from './grammarParser';

export interface NfaToGrammarStep {
  stepNumber: number;
  sourceType: 'STATE_MAP' | 'TRANSITION' | 'FINAL_STATE';
  origin: string;
  generatedRule: string;
  explanation: string;
}

export interface NfaToGrammarResult {
  grammar: Grammar;
  steps: NfaToGrammarStep[];
  stateToVariableMap: Record<string, string>;
}

/**
 * Maps state IDs to clean, unique uppercase variable names (e.g. initial -> S, then A, B, C, D...).
 * Guarantees every distinct state gets a distinct, non-colliding variable name.
 */
export function createCleanVariableMap(nfa: NFA): Record<string, string> {
  const map: Record<string, string> = {};
  const availableLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'T', 'U', 'W', 'X', 'Y', 'Z'];
  let letterIndex = 0;

  // Initial state is always mapped to S
  map[nfa.initialStateId] = 'S';

  nfa.states.forEach(s => {
    if (s.id !== nfa.initialStateId) {
      if (letterIndex < availableLetters.length) {
        map[s.id] = availableLetters[letterIndex++];
      } else {
        // Fallback for large NFAs
        const cleanLabel = s.label.replace(/[^A-Za-z0-9]/g, '');
        map[s.id] = `V_${cleanLabel || letterIndex++}`;
      }
    }
  });

  return map;
}

/**
 * Converts an NFA to a Right-Linear Regular Grammar.
 */
export function convertNfaToRegularGrammar(nfa: NFA): NfaToGrammarResult {
  const varMap = createCleanVariableMap(nfa);
  const steps: NfaToGrammarStep[] = [];
  let stepCounter = 1;

  // Variables are the mapped names of states
  const variables = Object.values(varMap);
  const terminals = new Set<string>();
  const productionMap = new Map<string, Set<string>>();

  // Initialize empty sets for each variable
  variables.forEach(v => productionMap.set(v, new Set<string>()));

  // 1. Process transitions: for transition q --a--> p, add rule V_q -> a V_p
  for (const t of nfa.transitions) {
    const fromVar = varMap[t.from] || t.from;
    const toVar = varMap[t.to] || t.to;
    const sym = t.symbol;

    if (sym !== CANONICAL_EPSILON && sym !== 'ε') {
      terminals.add(sym);
    }

    const rhs = (sym === CANONICAL_EPSILON || sym === 'ε') ? toVar : `${sym}${toVar}`;
    const ruleSet = productionMap.get(fromVar) || new Set();
    ruleSet.add(rhs);
    productionMap.set(fromVar, ruleSet);

    steps.push({
      stepNumber: stepCounter++,
      sourceType: 'TRANSITION',
      origin: `Transition: ${t.from} ──${sym}──> ${t.to}`,
      generatedRule: `${fromVar} → ${rhs}`,
      explanation: sym === CANONICAL_EPSILON || sym === 'ε'
        ? `Lambda transition from state ${t.from} (${fromVar}) to state ${t.to} (${toVar}) generates unit production ${fromVar} → ${toVar}.`
        : `Transition on symbol '${sym}' from state ${t.from} (${fromVar}) to state ${t.to} (${toVar}) generates rule ${fromVar} → ${rhs}.`
    });
  }

  // 2. Process final states: for each qf in F, add rule V_qf -> λ
  for (const finalId of nfa.finalStateIds) {
    const finalVar = varMap[finalId] || finalId;
    const ruleSet = productionMap.get(finalVar) || new Set();
    ruleSet.add(CANONICAL_EPSILON);
    productionMap.set(finalVar, ruleSet);

    steps.push({
      stepNumber: stepCounter++,
      sourceType: 'FINAL_STATE',
      origin: `Accepting state: ${finalId}`,
      generatedRule: `${finalVar} → ${CANONICAL_EPSILON}`,
      explanation: `State ${finalId} (${finalVar}) is an accepting state, so variable ${finalVar} must be able to derive λ to accept/terminate strings at this state.`
    });
  }

  const productions: ProductionRule[] = Array.from(productionMap.entries()).map(([lhs, rhsSet], idx) => ({
    id: `nfa-rule-${idx + 1}`,
    lhs,
    rhs: Array.from(rhsSet)
  }));

  const grammar: Grammar = {
    variables,
    terminals: Array.from(terminals).sort(),
    productions,
    startSymbol: varMap[nfa.initialStateId] || 'S'
  };

  return {
    grammar,
    steps,
    stateToVariableMap: varMap
  };
}

/**
 * Sample NFAs for demonstrating NFA to Grammar conversion.
 */
export const SAMPLE_NFAS: { id: string; name: string; description: string; nfa: NFA }[] = [
  {
    id: 'ends-with-b',
    name: 'Strings over {a, b} ending in "b"',
    description: 'Accepts all strings whose final character is b: (a + b)* b',
    nfa: {
      states: [
        { id: 'q0', label: 'q₀', isInitial: true, isFinal: false, x: 120, y: 150 },
        { id: 'q1', label: 'q₁', isInitial: false, isFinal: true, x: 380, y: 150 }
      ],
      alphabet: ['a', 'b'],
      transitions: [
        { from: 'q0', to: 'q0', symbol: 'a' },
        { from: 'q0', to: 'q0', symbol: 'b' },
        { from: 'q0', to: 'q1', symbol: 'b' }
      ],
      initialStateId: 'q0',
      finalStateIds: ['q1'],
      conversionSteps: []
    }
  },
  {
    id: 'alternating-01',
    name: 'Alternating (01)*',
    description: 'Accepts empty string and strings of repeated "01": (01)*',
    nfa: {
      states: [
        { id: 'q0', label: 'q₀', isInitial: true, isFinal: true, x: 120, y: 150 },
        { id: 'q1', label: 'q₁', isInitial: false, isFinal: false, x: 380, y: 150 }
      ],
      alphabet: ['0', '1'],
      transitions: [
        { from: 'q0', to: 'q1', symbol: '0' },
        { from: 'q1', to: 'q0', symbol: '1' }
      ],
      initialStateId: 'q0',
      finalStateIds: ['q0'],
      conversionSteps: []
    }
  },
  {
    id: 'contains-ab',
    name: 'Strings containing substring "ab"',
    description: 'Accepts (a+b)* ab (a+b)*',
    nfa: {
      states: [
        { id: 'q0', label: 'q₀', isInitial: true, isFinal: false, x: 100, y: 150 },
        { id: 'q1', label: 'q₁', isInitial: false, isFinal: false, x: 260, y: 150 },
        { id: 'q2', label: 'q₂', isInitial: false, isFinal: true, x: 420, y: 150 }
      ],
      alphabet: ['a', 'b'],
      transitions: [
        { from: 'q0', to: 'q0', symbol: 'a' },
        { from: 'q0', to: 'q0', symbol: 'b' },
        { from: 'q0', to: 'q1', symbol: 'a' },
        { from: 'q1', to: 'q2', symbol: 'b' },
        { from: 'q2', to: 'q2', symbol: 'a' },
        { from: 'q2', to: 'q2', symbol: 'b' }
      ],
      initialStateId: 'q0',
      finalStateIds: ['q2'],
      conversionSteps: []
    }
  }
];
