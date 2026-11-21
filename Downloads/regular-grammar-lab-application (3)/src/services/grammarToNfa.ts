import { Grammar, NFA, NFAState, NFATransition, NFAConversionStep } from '../types/grammar';
import { CANONICAL_EPSILON, normalizeEpsilon } from './grammarParser';

/**
 * Converts a Right-Linear Regular Grammar into an equivalent NFA M = (Q, Σ, δ, q0, F).
 */
/**
 * Helper to add a transition while preventing duplicate parallel transitions with identical symbol.
 */
function addTransitionSafely(
  transitions: NFATransition[],
  from: string,
  to: string,
  symbol: string,
  ruleOrigin?: string
): boolean {
  const exists = transitions.some(t => t.from === from && t.to === to && t.symbol === symbol);
  if (!exists) {
    transitions.push({ from, to, symbol, ruleOrigin });
    return true;
  }
  return false;
}

export function convertRightLinearToNfa(grammar: Grammar): NFA {
  const states: NFAState[] = [];
  const transitions: NFATransition[] = [];
  const conversionSteps: NFAConversionStep[] = [];
  const alphabet = [...grammar.terminals];

  const stateMap = new Map<string, NFAState>();

  // 1. Create a state for each variable in V
  grammar.variables.forEach(v => {
    const isInitial = v === grammar.startSymbol;
    const state: NFAState = {
      id: `q_${v}`,
      label: v,
      isInitial,
      isFinal: false,
      isIntermediate: false
    };
    states.push(state);
    stateMap.set(v, state);
  });

  // Dedicated final state for terminal-only productions (e.g. A -> w)
  const finalStateId = 'q_accept';
  const finalState: NFAState = {
    id: finalStateId,
    label: 'q_f',
    isInitial: false,
    isFinal: true,
    isIntermediate: false
  };

  let needsAcceptState = false;
  let intermediateCounter = 1;
  let stepCounter = 1;

  // Add initial step explanation
  conversionSteps.push({
    stepNumber: stepCounter++,
    rule: 'Initialization',
    action: `Created states for all grammar variables V = {${grammar.variables.join(', ')}} with start state q_${grammar.startSymbol}.`,
    addedStates: grammar.variables.map(v => `q_${v}`),
    addedTransitions: [],
    explanation: `In standard automata construction, each non-terminal variable acts as a state in the NFA. The grammar start symbol "${grammar.startSymbol}" designates the initial state.`
  });

  // Sort variables to process start symbol first for clarity
  const sortedVars = [...grammar.variables].sort((a, b) => {
    if (a === grammar.startSymbol) return -1;
    if (b === grammar.startSymbol) return 1;
    return a.localeCompare(b);
  });

  for (const varName of sortedVars) {
    const prod = grammar.productions.find(p => p.lhs === varName);
    if (!prod) continue;

    for (const rawAlt of prod.rhs) {
      const alt = normalizeEpsilon(rawAlt).replace(/\s+/g, '');
      const fromState = `q_${varName}`;
      const ruleText = `${varName} → ${rawAlt}`;

      // Case 1: Epsilon production (A -> λ)
      if (alt === CANONICAL_EPSILON || alt === '' || alt === 'ε') {
        const stateObj = stateMap.get(varName);
        if (stateObj) {
          stateObj.isFinal = true;
        }
        conversionSteps.push({
          stepNumber: stepCounter++,
          rule: ruleText,
          action: `Marked state q_${varName} as an accepting (final) state.`,
          addedStates: [],
          addedTransitions: [],
          explanation: `Since ${varName} can derive the empty string λ, the state q_${varName} itself must be an accepting condition.`
        });
        continue;
      }

      // Check if RHS ends with a variable
      let targetVar: string | null = null;
      const sortedByLen = [...grammar.variables].sort((a, b) => b.length - a.length);

      for (const v of sortedByLen) {
        if (alt.endsWith(v)) {
          targetVar = v;
          break;
        }
      }

      let terminalPart = alt;
      if (targetVar) {
        terminalPart = alt.slice(0, alt.length - targetVar.length);
      }

      // Case 2: Unit production (A -> B)
      if (targetVar && terminalPart.length === 0) {
        const toState = `q_${targetVar}`;
        addTransitionSafely(transitions, fromState, toState, CANONICAL_EPSILON, ruleText);

        conversionSteps.push({
          stepNumber: stepCounter++,
          rule: ruleText,
          action: `Added λ-transition: ${fromState} ──λ──> ${toState}`,
          addedStates: [],
          addedTransitions: [`${fromState} ──λ──> ${toState}`],
          explanation: `Unit production A → B allows an immediate non-deterministic transfer to state q_${targetVar} without consuming input.`
        });
        continue;
      }

      // Case 3: A -> aB (Single terminal followed by variable)
      if (targetVar && terminalPart.length === 1) {
        const symbol = terminalPart;
        const toState = `q_${targetVar}`;

        addTransitionSafely(transitions, fromState, toState, symbol, ruleText);

        conversionSteps.push({
          stepNumber: stepCounter++,
          rule: ruleText,
          action: `Added transition: ${fromState} ──${symbol}──> ${toState}`,
          addedStates: [],
          addedTransitions: [`${fromState} ──${symbol}──> ${toState}`],
          explanation: `Reading input symbol '${symbol}' in state q_${varName} transitions directly to state q_${targetVar}.`
        });
        continue;
      }

      // Case 4: A -> a1 a2 ... ak B (Multiple terminals followed by variable)
      if (targetVar && terminalPart.length > 1) {
        const toState = `q_${targetVar}`;
        let currentState = fromState;
        const newStates: string[] = [];
        const newTrans: string[] = [];

        for (let i = 0; i < terminalPart.length - 1; i++) {
          const char = terminalPart[i];
          const intermediateId = `q_mid_${intermediateCounter++}`;
          const intermediateState: NFAState = {
            id: intermediateId,
            label: `q[${varName}→${terminalPart.substring(0, i + 1)}]`,
            isInitial: false,
            isFinal: false,
            isIntermediate: true
          };
          states.push(intermediateState);
          newStates.push(intermediateId);

          addTransitionSafely(transitions, currentState, intermediateId, char, ruleText);
          newTrans.push(`${currentState} ──${char}──> ${intermediateId}`);
          currentState = intermediateId;
        }

        // Final terminal to target variable state
        const lastChar = terminalPart[terminalPart.length - 1];
        addTransitionSafely(transitions, currentState, toState, lastChar, ruleText);
        newTrans.push(`${currentState} ──${lastChar}──> ${toState}`);

        conversionSteps.push({
          stepNumber: stepCounter++,
          rule: ruleText,
          action: `Expanded multi-character sequence "${terminalPart}" with intermediate state(s).`,
          addedStates: newStates,
          addedTransitions: newTrans,
          explanation: `Automata consume one symbol per step. We decompose "${terminalPart}${targetVar}" by chaining through intermediate state(s).`
        });
        continue;
      }

      // Case 5: A -> a (Single terminal to accepting state)
      if (!targetVar && terminalPart.length === 1) {
        needsAcceptState = true;
        const symbol = terminalPart;

        addTransitionSafely(transitions, fromState, finalStateId, symbol, ruleText);

        conversionSteps.push({
          stepNumber: stepCounter++,
          rule: ruleText,
          action: `Added transition to final state: ${fromState} ──${symbol}──> ${finalStateId}`,
          addedStates: [finalStateId],
          addedTransitions: [`${fromState} ──${symbol}──> ${finalStateId}`],
          explanation: `Terminal production completes the derivation. Reading '${symbol}' transitions to accepting state q_f.`
        });
        continue;
      }

      // Case 6: A -> a1 a2 ... ak (Multiple terminals with no variable)
      if (!targetVar && terminalPart.length > 1) {
        needsAcceptState = true;
        let currentState = fromState;
        const newStates: string[] = [];
        const newTrans: string[] = [];

        for (let i = 0; i < terminalPart.length - 1; i++) {
          const char = terminalPart[i];
          const intermediateId = `q_mid_${intermediateCounter++}`;
          const intermediateState: NFAState = {
            id: intermediateId,
            label: `q[${varName}→${terminalPart.substring(0, i + 1)}]`,
            isInitial: false,
            isFinal: false,
            isIntermediate: true
          };
          states.push(intermediateState);
          newStates.push(intermediateId);

          addTransitionSafely(transitions, currentState, intermediateId, char, ruleText);
          newTrans.push(`${currentState} ──${char}──> ${intermediateId}`);
          currentState = intermediateId;
        }

        const lastChar = terminalPart[terminalPart.length - 1];
        addTransitionSafely(transitions, currentState, finalStateId, lastChar, ruleText);
        newTrans.push(`${currentState} ──${lastChar}──> ${finalStateId}`);

        conversionSteps.push({
          stepNumber: stepCounter++,
          rule: ruleText,
          action: `Expanded terminal-only sequence "${terminalPart}" terminating at final state q_f.`,
          addedStates: newStates,
          addedTransitions: newTrans,
          explanation: `Sequence decomposes into steps leading directly into the dedicated accepting state q_f.`
        });
      }
    }
  }

  // Include final state q_f if referenced
  if (needsAcceptState) {
    states.push(finalState);
  }

  const finalStateIds = states.filter(s => s.isFinal).map(s => s.id);
  const initialStateId = `q_${grammar.startSymbol}`;

  return {
    states,
    alphabet,
    transitions,
    initialStateId,
    finalStateIds,
    conversionSteps
  };
}

/**
 * Converts a Left-Linear Regular Grammar into an equivalent NFA M = (Q, Σ, δ, q0, F).
 *
 * Mathematical Algorithm (Left-Linear Dual Construction):
 * In Left-Linear derivations: S => B w_k => ... => A w_1 w_k => w_0 w_1 ... w_k.
 * Derivations build terminal strings from right to left, terminating with a base rule A -> w_0.
 * In the equivalent NFA:
 * 1. A fresh start state q_0 is created.
 * 2. For each base terminal production A -> w_0, add a transition path from q_0 to state q_A on w_0.
 * 3. For each recursive production A -> B w, add a transition path from state q_B to state q_A on w.
 * 4. The state corresponding to the grammar start symbol, q_S, is designated as the accepting state (F = { q_S }).
 * 5. This directly produces an automaton recognizing L(G) reading left-to-right without string reversal!
 */
export function convertLeftLinearToNfa(grammar: Grammar): NFA {
  const states: NFAState[] = [];
  const transitions: NFATransition[] = [];
  const conversionSteps: NFAConversionStep[] = [];
  const alphabet = [...grammar.terminals];

  let intermediateCounter = 1;
  let stepCounter = 1;

  // 1. Create fresh initial state q_0
  const startStateId = 'q_start';
  const startState: NFAState = {
    id: startStateId,
    label: 'q₀',
    isInitial: true,
    isFinal: false,
    isIntermediate: false
  };
  states.push(startState);

  // 2. Create a state for each variable in V; q_S is the accepting state
  grammar.variables.forEach(v => {
    const isFinal = v === grammar.startSymbol;
    const state: NFAState = {
      id: `q_${v}`,
      label: v,
      isInitial: false,
      isFinal,
      isIntermediate: false
    };
    states.push(state);
  });

  conversionSteps.push({
    stepNumber: stepCounter++,
    rule: 'Initialization (Left-Linear Dual)',
    action: `Created fresh start state q₀ and variable states V = {${grammar.variables.join(', ')}}. Marked q_${grammar.startSymbol} as accepting.`,
    addedStates: [startStateId, ...grammar.variables.map(v => `q_${v}`)],
    addedTransitions: [],
    explanation: `Left-linear derivations terminate when the base production produces the prefix and terminate at the start variable S. Thus, q₀ is the entry state and q_${grammar.startSymbol} is the accepting state.`
  });

  const sortedVars = [...grammar.variables].sort((a, b) => a.localeCompare(b));
  const sortedByLen = [...grammar.variables].sort((a, b) => b.length - a.length);

  for (const varName of sortedVars) {
    const prod = grammar.productions.find(p => p.lhs === varName);
    if (!prod) continue;

    for (const rawAlt of prod.rhs) {
      const alt = normalizeEpsilon(rawAlt).replace(/\s+/g, '');
      const toState = `q_${varName}`;
      const ruleText = `${varName} → ${rawAlt}`;

      // Case 1: Epsilon production A -> λ
      if (alt === CANONICAL_EPSILON || alt === '' || alt === 'ε') {
        addTransitionSafely(transitions, startStateId, toState, CANONICAL_EPSILON, ruleText);

        conversionSteps.push({
          stepNumber: stepCounter++,
          rule: ruleText,
          action: `Added λ-transition: ${startStateId} ──λ──> ${toState}`,
          addedStates: [],
          addedTransitions: [`${startStateId} ──λ──> ${toState}`],
          explanation: `Base rule ${varName} → λ allows starting at q₀ and directly entering state q_${varName} on empty string.`
        });
        continue;
      }

      // Check if RHS starts with a variable (Left-Linear form: A -> Bw or A -> B)
      let sourceVar: string | null = null;
      for (const v of sortedByLen) {
        if (alt.startsWith(v)) {
          sourceVar = v;
          break;
        }
      }

      let terminalPart = alt;
      if (sourceVar) {
        terminalPart = alt.slice(sourceVar.length);
      }

      // Case 2: Unit production A -> B (where B is variable)
      if (sourceVar && terminalPart.length === 0) {
        const fromState = `q_${sourceVar}`;
        addTransitionSafely(transitions, fromState, toState, CANONICAL_EPSILON, ruleText);

        conversionSteps.push({
          stepNumber: stepCounter++,
          rule: ruleText,
          action: `Added λ-transition: ${fromState} ──λ──> ${toState}`,
          addedStates: [],
          addedTransitions: [`${fromState} ──λ──> ${toState}`],
          explanation: `Unit production ${varName} → ${sourceVar} connects state q_${sourceVar} to state q_${varName} via λ.`
        });
        continue;
      }

      // Case 3: A -> Ba (Single terminal following variable B)
      if (sourceVar && terminalPart.length === 1) {
        const fromState = `q_${sourceVar}`;
        const symbol = terminalPart;

        addTransitionSafely(transitions, fromState, toState, symbol, ruleText);

        conversionSteps.push({
          stepNumber: stepCounter++,
          rule: ruleText,
          action: `Added transition: ${fromState} ──${symbol}──> ${toState}`,
          addedStates: [],
          addedTransitions: [`${fromState} ──${symbol}──> ${toState}`],
          explanation: `Recursive rule ${varName} → ${sourceVar}${symbol} corresponds to reading '${symbol}' from state q_${sourceVar} to state q_${varName}.`
        });
        continue;
      }

      // Case 4: A -> B a1 a2 ... ak (Multiple terminals following variable B)
      if (sourceVar && terminalPart.length > 1) {
        const fromState = `q_${sourceVar}`;
        let currentState = fromState;
        const newStates: string[] = [];
        const newTrans: string[] = [];

        for (let i = 0; i < terminalPart.length - 1; i++) {
          const char = terminalPart[i];
          const intermediateId = `q_mid_${intermediateCounter++}`;
          const intermediateState: NFAState = {
            id: intermediateId,
            label: `q[${sourceVar}→${terminalPart.substring(0, i + 1)}]`,
            isInitial: false,
            isFinal: false,
            isIntermediate: true
          };
          states.push(intermediateState);
          newStates.push(intermediateId);

          addTransitionSafely(transitions, currentState, intermediateId, char, ruleText);
          newTrans.push(`${currentState} ──${char}──> ${intermediateId}`);
          currentState = intermediateId;
        }

        const lastChar = terminalPart[terminalPart.length - 1];
        addTransitionSafely(transitions, currentState, toState, lastChar, ruleText);
        newTrans.push(`${currentState} ──${lastChar}──> ${toState}`);

        conversionSteps.push({
          stepNumber: stepCounter++,
          rule: ruleText,
          action: `Expanded multi-symbol suffix "${terminalPart}" with intermediate state(s).`,
          addedStates: newStates,
          addedTransitions: newTrans,
          explanation: `Reading suffix "${terminalPart}" chains from state q_${sourceVar} through intermediate state(s) into state q_${varName}.`
        });
        continue;
      }

      // Case 5: A -> a (Base terminal production, single terminal from start state q_0)
      if (!sourceVar && terminalPart.length === 1) {
        const symbol = terminalPart;
        addTransitionSafely(transitions, startStateId, toState, symbol, ruleText);

        conversionSteps.push({
          stepNumber: stepCounter++,
          rule: ruleText,
          action: `Added base transition: ${startStateId} ──${symbol}──> ${toState}`,
          addedStates: [],
          addedTransitions: [`${startStateId} ──${symbol}──> ${toState}`],
          explanation: `Base rule ${varName} → ${symbol} starts at q₀ and consumes '${symbol}' to enter state q_${varName}.`
        });
        continue;
      }

      // Case 6: A -> a1 a2 ... ak (Base terminal production with multiple terminals from start state q_0)
      if (!sourceVar && terminalPart.length > 1) {
        let currentState = startStateId;
        const newStates: string[] = [];
        const newTrans: string[] = [];

        for (let i = 0; i < terminalPart.length - 1; i++) {
          const char = terminalPart[i];
          const intermediateId = `q_mid_${intermediateCounter++}`;
          const intermediateState: NFAState = {
            id: intermediateId,
            label: `q[q₀→${terminalPart.substring(0, i + 1)}]`,
            isInitial: false,
            isFinal: false,
            isIntermediate: true
          };
          states.push(intermediateState);
          newStates.push(intermediateId);

          addTransitionSafely(transitions, currentState, intermediateId, char, ruleText);
          newTrans.push(`${currentState} ──${char}──> ${intermediateId}`);
          currentState = intermediateId;
        }

        const lastChar = terminalPart[terminalPart.length - 1];
        addTransitionSafely(transitions, currentState, toState, lastChar, ruleText);
        newTrans.push(`${currentState} ──${lastChar}──> ${toState}`);

        conversionSteps.push({
          stepNumber: stepCounter++,
          rule: ruleText,
          action: `Expanded base sequence "${terminalPart}" from start state q₀.`,
          addedStates: newStates,
          addedTransitions: newTrans,
          explanation: `Base sequence "${terminalPart}" chains from start state q₀ into state q_${varName}.`
        });
      }
    }
  }

  const finalStateIds = states.filter(s => s.isFinal).map(s => s.id);
  const initialStateId = startStateId;

  return {
    states,
    alphabet,
    transitions,
    initialStateId,
    finalStateIds,
    conversionSteps
  };
}

/**
 * Universal conversion dispatcher:
 * Converts either a Right-Linear or Left-Linear Regular Grammar to an equivalent NFA.
 */
export function convertGrammarToNfa(grammar: Grammar, isLeftLinear: boolean = false): NFA {
  if (isLeftLinear) {
    return convertLeftLinearToNfa(grammar);
  }
  return convertRightLinearToNfa(grammar);
}
