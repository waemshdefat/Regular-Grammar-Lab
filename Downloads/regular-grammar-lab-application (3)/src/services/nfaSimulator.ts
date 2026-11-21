import { NFA, NFATransition, NfaValidationIssue, NfaValidationResult, SimulationResult, SimulationStep } from '../types/grammar';
import { CANONICAL_EPSILON } from './grammarParser';

/**
 * Validates an NFA against formal automata criteria:
 * - Empty automaton check
 * - Missing or invalid initial state
 * - Missing or invalid accepting states
 * - Duplicate states and transitions
 * - Invalid transition endpoints (dangling states)
 * - Unreachable states from initial state
 */
export function validateNFA(nfa: NFA): NfaValidationResult {
  const issues: NfaValidationIssue[] = [];

  // 1. State checks
  if (!nfa.states || nfa.states.length === 0) {
    issues.push({ severity: 'error', message: 'The automaton contains no states (empty automaton).' });
    return {
      isValid: false,
      issues,
      stats: {
        stateCount: 0,
        transitionCount: 0,
        acceptingStateCount: 0,
        unreachableStateIds: [],
        hasInitialState: false,
        hasDuplicateTransitions: false,
        hasEpsilonTransitions: false
      }
    };
  }

  const stateIds = new Set<string>();
  const duplicateStateIds = new Set<string>();

  for (const s of nfa.states) {
    if (stateIds.has(s.id)) {
      duplicateStateIds.add(s.id);
    }
    stateIds.add(s.id);
  }

  if (duplicateStateIds.size > 0) {
    issues.push({
      severity: 'error',
      message: `Duplicate state IDs found: { ${Array.from(duplicateStateIds).join(', ')} }.`
    });
  }

  // 2. Initial state
  const hasInitialState = Boolean(nfa.initialStateId && stateIds.has(nfa.initialStateId));
  if (!hasInitialState) {
    issues.push({
      severity: 'error',
      message: `Automaton is missing a valid initial state (ID: "${nfa.initialStateId || 'none'}").`
    });
  }

  // 3. Accepting states
  const finalStateSet = new Set(nfa.finalStateIds || []);
  const invalidFinalIds: string[] = [];
  for (const fId of finalStateSet) {
    if (!stateIds.has(fId)) {
      invalidFinalIds.push(fId);
    }
  }

  if (invalidFinalIds.length > 0) {
    issues.push({
      severity: 'error',
      message: `Accepting state ID(s) do not exist in state set: { ${invalidFinalIds.join(', ')} }.`
    });
  }

  if (finalStateSet.size === 0) {
    issues.push({
      severity: 'warning',
      message: 'The automaton has no accepting states; it will reject all strings (language is ∅).'
    });
  } else if (finalStateSet.size > 1) {
    issues.push({
      severity: 'info',
      message: `Automaton has multiple accepting states (${finalStateSet.size} final states).`
    });
  }

  // 4. Transitions
  const transitionKeys = new Set<string>();
  let hasDuplicateTransitions = false;
  let hasEpsilonTransitions = false;
  const invalidTransitions: string[] = [];

  for (const t of nfa.transitions || []) {
    if (!stateIds.has(t.from) || !stateIds.has(t.to)) {
      invalidTransitions.push(`${t.from} ──${t.symbol}──> ${t.to}`);
    }

    if (t.symbol === CANONICAL_EPSILON || t.symbol === 'ε') {
      hasEpsilonTransitions = true;
    }

    const key = `${t.from}##${t.symbol}##${t.to}`;
    if (transitionKeys.has(key)) {
      hasDuplicateTransitions = true;
    } else {
      transitionKeys.add(key);
    }
  }

  if (invalidTransitions.length > 0) {
    issues.push({
      severity: 'error',
      message: `Transition(s) connect to undeclared state IDs: ${invalidTransitions.slice(0, 3).join(', ')}${invalidTransitions.length > 3 ? '...' : ''}.`
    });
  }

  if (hasDuplicateTransitions) {
    issues.push({
      severity: 'info',
      message: 'Automaton contains duplicate transition entries (redundant parallel edges).'
    });
  }

  if (hasEpsilonTransitions) {
    issues.push({
      severity: 'info',
      message: 'Automaton contains ε/λ-transitions (Non-deterministic spontaneous transitions).'
    });
  }

  // 5. Reachability from initial state (BFS)
  const reachableStates = new Set<string>();
  if (hasInitialState) {
    const queue = [nfa.initialStateId];
    reachableStates.add(nfa.initialStateId);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      for (const t of nfa.transitions) {
        if (t.from === curr && !reachableStates.has(t.to)) {
          reachableStates.add(t.to);
          queue.push(t.to);
        }
      }
    }
  }

  const unreachableStateIds = Array.from(stateIds).filter(id => !reachableStates.has(id));
  if (unreachableStateIds.length > 0 && hasInitialState) {
    issues.push({
      severity: 'warning',
      message: `Unreachable state(s) from initial state: { ${unreachableStateIds.map(id => {
        const s = nfa.states.find(st => st.id === id);
        return s ? s.label : id;
      }).join(', ')} }.`
    });
  }

  const hasErrors = issues.some(i => i.severity === 'error');

  return {
    isValid: !hasErrors,
    issues,
    stats: {
      stateCount: nfa.states.length,
      transitionCount: nfa.transitions.length,
      acceptingStateCount: finalStateSet.size,
      unreachableStateIds,
      hasInitialState,
      hasDuplicateTransitions,
      hasEpsilonTransitions
    }
  };
}

/**
 * Computes the epsilon-closure of a set of states in an NFA.
 * ECLOSE(S) = states reachable from S via zero or more λ-transitions.
 */
export function getEpsilonClosure(
  states: Set<string>,
  transitions: NFATransition[]
): { closure: Set<string>; epsilonTransitions: NFATransition[] } {
  const closure = new Set<string>(states);
  const queue = Array.from(states);
  const epsilonTransitions: NFATransition[] = [];
  const visitedTransitions = new Set<string>();

  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const t of transitions) {
      if (t.from === curr && (t.symbol === CANONICAL_EPSILON || t.symbol === 'ε')) {
        const key = `${t.from}->${t.to}`;
        if (!visitedTransitions.has(key)) {
          visitedTransitions.add(key);
          epsilonTransitions.push(t);
        }
        if (!closure.has(t.to)) {
          closure.add(t.to);
          queue.push(t.to);
        }
      }
    }
  }

  return { closure, epsilonTransitions };
}

/**
 * Simulates the NFA on an input string step-by-step.
 */
export function simulateNFA(nfa: NFA, rawInput: string): SimulationResult {
  const input = rawInput.trim();
  const steps: SimulationStep[] = [];
  const stateLabelMap = new Map<string, string>();
  nfa.states.forEach(s => stateLabelMap.set(s.id, s.label));

  const formatSet = (set: Set<string>) =>
    `{ ${Array.from(set).map(id => stateLabelMap.get(id) || id).join(', ')} }`;

  // Validation guard: if NFA has no initial state or no states
  if (!nfa.states || nfa.states.length === 0 || !nfa.initialStateId) {
    return {
      inputString: input,
      accepted: false,
      steps: [],
      finalStateIds: [],
      reason: 'Rejected: Automaton has no states or missing initial state.'
    };
  }

  // Initial step: closure of initial state
  const initialSet = new Set<string>([nfa.initialStateId]);
  const initialClosureResult = getEpsilonClosure(initialSet, nfa.transitions);
  let activeStates = initialClosureResult.closure;

  steps.push({
    stepIndex: 0,
    currentSymbol: null,
    remainingInput: input,
    activeStateIds: Array.from(activeStates),
    executedTransitions: initialClosureResult.epsilonTransitions,
    description: `Start state q₀ = ${stateLabelMap.get(nfa.initialStateId) || nfa.initialStateId}. Initial λ-closure: ${formatSet(activeStates)}.`
  });

  // If input string is empty (λ)
  if (input === '' || input === CANONICAL_EPSILON || input === 'ε') {
    const finalSet = new Set(nfa.finalStateIds);
    const hasFinal = Array.from(activeStates).some(id => finalSet.has(id));
    return {
      inputString: 'λ (empty string)',
      accepted: hasFinal,
      steps,
      finalStateIds: Array.from(activeStates).filter(id => finalSet.has(id)),
      reason: hasFinal
        ? `Accepted: Initial λ-closure contains accepting state(s) ${Array.from(activeStates).filter(id => finalSet.has(id)).map(id => stateLabelMap.get(id) || id).join(', ')}.`
        : `Rejected: The empty string λ is not accepted because no state in the initial λ-closure ${formatSet(activeStates)} is an accepting state.`
    };
  }

  // Process input symbols one by one
  for (let i = 0; i < input.length; i++) {
    const symbol = input[i];
    const remaining = input.slice(i + 1);
    const nextStates = new Set<string>();
    const executedTrans: NFATransition[] = [];

    // Find all direct transitions on current symbol
    for (const currState of activeStates) {
      for (const t of nfa.transitions) {
        if (t.from === currState && t.symbol === symbol) {
          nextStates.add(t.to);
          executedTrans.push(t);
        }
      }
    }

    if (nextStates.size === 0) {
      steps.push({
        stepIndex: i + 1,
        currentSymbol: symbol,
        remainingInput: remaining,
        activeStateIds: [],
        executedTransitions: [],
        description: `Read symbol '${symbol}': No valid transition from active states ${formatSet(activeStates)}. Automaton halts (dead state).`
      });
      activeStates = new Set();
      break;
    }

    // Compute lambda-closure of the reached states
    const closureResult = getEpsilonClosure(nextStates, nfa.transitions);
    activeStates = closureResult.closure;
    const allExecuted = [...executedTrans, ...closureResult.epsilonTransitions];

    steps.push({
      stepIndex: i + 1,
      currentSymbol: symbol,
      remainingInput: remaining,
      activeStateIds: Array.from(activeStates),
      executedTransitions: allExecuted,
      description: `Read symbol '${symbol}': Reached ${formatSet(nextStates)}. Post-symbol λ-closure gives active states ${formatSet(activeStates)}.`
    });
  }

  const finalSet = new Set(nfa.finalStateIds);
  const reachingFinalStates = Array.from(activeStates).filter(id => finalSet.has(id));
  const accepted = reachingFinalStates.length > 0;

  let reason = '';
  if (activeStates.size === 0) {
    reason = `Rejected: The automaton encountered a dead state where no valid transition was defined for the current symbol.`;
  } else if (accepted) {
    reason = `Accepted! End of input string reached. Active state set ${formatSet(activeStates)} contains accepting state(s): ${reachingFinalStates.map(id => stateLabelMap.get(id) || id).join(', ')}.`;
  } else {
    reason = `Rejected: End of input string reached, but active states ${formatSet(activeStates)} do not include any accepting state (Final states: ${formatSet(finalSet)}).`;
  }

  return {
    inputString: input,
    accepted,
    steps,
    finalStateIds: reachingFinalStates,
    reason
  };
}
