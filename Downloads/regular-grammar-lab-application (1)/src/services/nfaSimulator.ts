import { NFA, NFATransition, SimulationResult, SimulationStep } from '../types/grammar';
import { CANONICAL_EPSILON } from './grammarParser';

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
