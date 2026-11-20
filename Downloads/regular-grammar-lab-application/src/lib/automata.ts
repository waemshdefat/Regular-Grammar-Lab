import {
  compactExpression,
  deriveWord,
  formatProduction,
  isEpsilonMarker,
  terminalLength,
  uid,
  VARIABLE_PATTERN,
} from "./grammar";
import {
  LAMBDA,
  type Analysis,
  type ConversionResult,
  type Grammar,
  type Issue,
  type Nfa,
  type NfaState,
  type NfaTransition,
  type ReverseResult,
  type SimulationResult,
  type SimulationStep,
} from "./types";

function epsilonTransitionLabel(label: string): boolean {
  return isEpsilonMarker(label);
}

export function stateLabel(nfa: Nfa, id: string): string {
  return nfa.states.find((state) => state.id === id)?.label ?? "?";
}

export function isFinal(nfa: Nfa, id: string): boolean {
  return nfa.finalIds.includes(id);
}

export function normalizeInput(raw: string): string {
  const compact = compactExpression(raw);
  return epsilonTransitionLabel(compact) ? "" : compact;
}

export function convertGrammarToNfa(grammar: Grammar, analysis: Analysis): ConversionResult {
  const steps: string[] = [];
  const stepHighlights: string[][] = [];
  if (!analysis.valid || !analysis.convertible) {
    const reason =
      analysis.kind === "left-linear"
        ? "Direct construction is implemented for right-linear grammars. A left-linear grammar first needs reversal into an equivalent right-linear grammar for L(G)ᴿ."
        : analysis.kind === "mixed"
          ? "This grammar mixes left- and right-linear productions. A single-orientation regular grammar is required."
          : analysis.kind === "non-regular"
            ? "At least one production has multiple variables or a variable in an interior position. Rewrite the grammar in right-linear form before conversion."
            : "This grammar is not a valid right-linear grammar. Fix the reported syntax errors first.";
    return { nfa: null, steps: [], stepHighlights: [], error: reason };
  }
  if (grammar.productions.length > 80) {
    return { nfa: null, steps: [], stepHighlights: [], error: "The grammar has more than 80 alternatives; reduce it for interactive visualization." };
  }

  const variables = analysis.variables;
  const variableId = (name: string) => `v:${name}`;
  const states: NfaState[] = variables.map((variable) => ({
    id: variableId(variable),
    label: variable,
    kind: "variable",
  }));
  const finalId = "state:accept";
  states.push({ id: finalId, label: "F", kind: "final" });
  const transitions: NfaTransition[] = [];
  const startId = variableId(compactExpression(grammar.start));
  let intermediateCount = 0;

  const addTransition = (from: string, to: string, label: string): string => {
    const id = uid("t");
    transitions.push({ id, from, to, label: label || LAMBDA });
    return id;
  };

  const addChain = (from: string, symbols: string[], to: string): { chain: string; ids: string[] } => {
    const ids: string[] = [];
    if (symbols.length === 0) {
      ids.push(addTransition(from, to, LAMBDA));
      return { chain: LAMBDA, ids };
    }
    let cursor = from;
    for (let index = 0; index < symbols.length; index += 1) {
      const last = index === symbols.length - 1;
      let target = to;
      if (!last) {
        intermediateCount += 1;
        const id = `state:intermediate:${intermediateCount}`;
        const label = `q${intermediateCount}`;
        states.push({ id, label, kind: "intermediate" });
        target = id;
      }
      ids.push(addTransition(cursor, target, symbols[index]));
      cursor = target;
    }
    return { chain: symbols.join(""), ids };
  };

  steps.push(`1. Create one NFA state for each grammar variable: ${variables.join(", ")}.`);
  steps.push(`2. Add one dedicated accepting state F. The initial state is ${compactExpression(grammar.start)}.`);
  steps.push("3. Translate every alternative independently; this naturally creates nondeterminism.");
  stepHighlights.push([], [], []);

  for (const item of analysis.productions) {
    if (!states.some((state) => state.id === variableId(item.lhs))) {
      states.push({ id: variableId(item.lhs), label: item.lhs, kind: "variable" });
    }
    const from = variableId(item.lhs);
    if (item.isEpsilon) {
      const ids = [addTransition(from, finalId, LAMBDA)];
      steps.push(`${formatProduction({ id: item.id, lhs: item.lhs, rhs: item.rhs })}: add a ${LAMBDA}-transition ${item.lhs} → F; the empty suffix is accepted.`);
      stepHighlights.push(ids);
      continue;
    }
    if (item.variable) {
      const targetVariable = item.variable;
      if (!states.some((state) => state.id === variableId(targetVariable))) {
        states.push({ id: variableId(targetVariable), label: targetVariable, kind: "variable" });
      }
      const path = item.terminalString.split("");
      const chain = addChain(from, path, variableId(targetVariable));
      steps.push(
        `${formatProduction({ id: item.id, lhs: item.lhs, rhs: item.rhs })}: read x = ${chain.chain || LAMBDA} from ${item.lhs}, then enter ${targetVariable}` +
          (path.length > 1 ? `; ${path.length - 1} intermediate state(s) split the terminal sequence.` : path.length === 0 ? "; the unit production becomes a λ-transition." : "."),
      );
      stepHighlights.push(chain.ids);
      continue;
    }
    const path = item.terminalString.split("");
    const chain = addChain(from, path, finalId);
    steps.push(
      `${formatProduction({ id: item.id, lhs: item.lhs, rhs: item.rhs })}: read terminal string x = ${chain.chain} and enter F` +
        (path.length > 1 ? `; ${path.length - 1} intermediate state(s) split the sequence.` : "."),
    );
    stepHighlights.push(chain.ids);
  }
  steps.push(`4. Mark ${compactExpression(grammar.start)} as initial and F as the only final state. A string is accepted exactly when the derivation can terminate after consuming it.`);
  stepHighlights.push([]);
  return {
    nfa: { states, transitions, startId, finalIds: [finalId] },
    steps,
    stepHighlights,
    error: null,
  };
}

function epsilonClosure(nfa: Nfa, seeds: string[]): { states: string[]; taken: string[] } {
  const seen = new Set(seeds);
  const queue = [...seeds];
  const taken: string[] = [];
  const epsilonEdges = nfa.transitions.filter((transition) => epsilonTransitionLabel(transition.label));
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const edge of epsilonEdges) {
      if (edge.from !== current) continue;
      taken.push(edge.id);
      if (!seen.has(edge.to)) {
        seen.add(edge.to);
        queue.push(edge.to);
      }
    }
  }
  return { states: Array.from(seen), taken };
}

export function simulateNfa(nfa: Nfa, rawInput: string): SimulationResult {
  const input = normalizeInput(rawInput);
  const symbols = input.split("");
  if (!nfa.states.some((state) => state.id === nfa.startId) || nfa.finalIds.length === 0) {
    return {
      steps: [],
      accepted: false,
      input,
      message: "The automaton is incomplete: it needs a valid initial state and at least one final state.",
      completedInput: false,
    };
  }
  const initialClosure = epsilonClosure(nfa, [nfa.startId]);
  const closureExtras = initialClosure.states.filter((id) => id !== nfa.startId);
  const steps: SimulationStep[] = [
    {
      index: 0,
      consumed: null,
      before: [nfa.startId],
      taken: initialClosure.taken,
      after: initialClosure.states,
      note: closureExtras.length
        ? `Start at ${stateLabel(nfa, nfa.startId)}. λ-closure adds ${closureExtras.map((id) => stateLabel(nfa, id)).join(", ")} without consuming input.`
        : `Start at ${stateLabel(nfa, nfa.startId)}. No λ-transition is available from the initial state.`,
    },
  ];
  let current = initialClosure.states;
  let completedInput = true;
  for (let index = 0; index < symbols.length; index += 1) {
    const symbol = symbols[index];
    const direct = nfa.transitions.filter(
      (transition) =>
        current.includes(transition.from) &&
        !epsilonTransitionLabel(transition.label) &&
        compactExpression(transition.label) === symbol,
    );
    const targets = Array.from(new Set(direct.map((transition) => transition.to)));
    const closure = epsilonClosure(nfa, targets);
    const descriptions = direct
      .slice(0, 3)
      .map((edge) => `${stateLabel(nfa, edge.from)} --${edge.label}--> ${stateLabel(nfa, edge.to)}`)
      .join(", ");
    const epsilonExtras = closure.states.filter((id) => !targets.includes(id));
    steps.push({
      index: index + 1,
      consumed: symbol,
      before: current,
      taken: [...direct.map((edge) => edge.id), ...closure.taken],
      after: closure.states,
      note: direct.length
        ? `Read "${symbol}": ${descriptions}${direct.length > 3 ? ", …" : ""}.` +
          (epsilonExtras.length ? ` λ-closure then adds ${epsilonExtras.map((id) => stateLabel(nfa, id)).join(", ")}.` : " No additional λ-moves.")
        : `Read "${symbol}": no transition labelled "${symbol}" leaves any active state. All computation branches die.`,
    });
    current = closure.states;
    if (current.length === 0) {
      completedInput = false;
      break;
    }
  }
  const finalActive = current.filter((id) => isFinal(nfa, id));
  const accepted = completedInput && finalActive.length > 0;
  let message: string;
  if (accepted) {
    message = `Accepted: after reading ${input || LAMBDA}, the active set intersects F (${finalActive.map((id) => stateLabel(nfa, id)).join(", ")}).`;
  } else if (!completedInput) {
    message = `Rejected: the active state set became empty before the input was fully read.`;
  } else {
    message = `Rejected: the full input was read, but the active states {${current.map((id) => stateLabel(nfa, id)).join(", ") || "∅"}} are not final.`;
  }
  return { steps, accepted, input, message, completedInput };
}

function variableNameForState(label: string, index: number, used: Set<string>): string {
  const cleaned = label.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const base = /^[A-Z]/.test(cleaned) ? cleaned : `Q${cleaned || index}`;
  let candidate = base;
  let suffix = 1;
  while (used.has(candidate)) {
    candidate = `${base}${suffix}`;
    suffix += 1;
  }
  used.add(candidate);
  return candidate;
}

export function validateNfa(nfa: Nfa): Issue[] {
  const issues: Issue[] = [];
  const ids = new Set(nfa.states.map((state) => state.id));
  const seenLabels = new Set<string>();
  for (const state of nfa.states) {
    if (seenLabels.has(state.label)) issues.push({ level: "warning", message: `Two states are labelled "${state.label}"; grammar variables were disambiguated automatically.` });
    seenLabels.add(state.label);
  }
  if (!ids.has(nfa.startId)) issues.push({ level: "error", message: "The selected initial state does not exist." });
  for (const id of nfa.finalIds) {
    if (!ids.has(id)) issues.push({ level: "error", message: "A selected final state does not exist." });
  }
  if (nfa.finalIds.length === 0) issues.push({ level: "warning", message: "No final state is selected, so no string can be accepted." });
  for (const transition of nfa.transitions) {
    if (!ids.has(transition.from) || !ids.has(transition.to)) {
      issues.push({ level: "error", message: `Transition "${stateLabel(nfa, transition.from)} --${transition.label}--> ${stateLabel(nfa, transition.to)}" references a missing state.` });
    }
    const label = compactExpression(transition.label);
    if (isEpsilonMarker(label)) continue;
    if (!/^[a-z0-9#+*()\-_$]+$/.test(label)) {
      issues.push({ level: "warning", message: `Label "${transition.label}" should use lowercase terminals, digits, or ${LAMBDA}; uppercase labels would be read as variables.` });
    }
    if (label.length > 1) {
      issues.push({ level: "info", message: `Label "${label}" is a terminal string x ∈ T*. The reverse conversion emits a production with x; the simulator consumes one symbol per transition.` });
    }
  }
  return issues;
}

export function nfaToGrammar(nfa: Nfa): ReverseResult {
  const issues = validateNfa(nfa);
  const steps: string[] = [];
  const used = new Set<string>();
  const variableMap: Record<string, string> = {};
  nfa.states.forEach((state, index) => {
    variableMap[state.id] = variableNameForState(state.label, index, used);
  });
  const startVariable = variableMap[nfa.startId] ?? "S";
  const productionMap = new Map<string, string[]>();
  const addProduction = (lhs: string, rhs: string) => {
    const alternatives = productionMap.get(lhs) ?? [];
    if (!alternatives.includes(rhs)) alternatives.push(rhs);
    productionMap.set(lhs, alternatives);
  };
  steps.push(`1. Introduce one grammar variable for each NFA state: ${nfa.states.map((state) => `${state.label} ↦ ${variableMap[state.id]}`).join(", ")}.`);
  steps.push(`2. Use the variable of the initial state, ${startVariable}, as the start symbol.`);
  steps.push("3. For every transition q --a--> p, add Vq → aVp. For q --λ--> p, add the unit production Vq → Vp.");
  
  for (const transition of nfa.transitions) {
    const from = variableMap[transition.from];
    const to = variableMap[transition.to];
    if (!from || !to) continue;
    const label = compactExpression(transition.label);
    const rhs = isEpsilonMarker(label) ? to : `${label}${to}`;
    addProduction(from, rhs);
    steps.push(
      isEpsilonMarker(label)
        ? `${stateLabel(nfa, transition.from)} --${LAMBDA}--> ${stateLabel(nfa, transition.to)}  ⇒  ${from} → ${to}`
        : `${stateLabel(nfa, transition.from)} --${label}--> ${stateLabel(nfa, transition.to)}  ⇒  ${from} → ${label}${to}`,
    );
  }
  steps.push("4. For every final state qf, add Vqf → λ. This lets the derivation stop when the automaton can accept.");
  for (const id of nfa.finalIds) {
    const variable = variableMap[id];
    if (!variable) continue;
    addProduction(variable, LAMBDA);
    steps.push(`${stateLabel(nfa, id)} ∈ F  ⇒  ${variable} → ${LAMBDA}`);
  }
  const stateOrder = [nfa.startId, ...nfa.states.map((state) => state.id).filter((id) => id !== nfa.startId)];
  const productions = stateOrder.flatMap((id) => {
    const lhs = variableMap[id];
    return (productionMap.get(lhs) ?? []).map((rhs) => ({ id: uid("reverse"), lhs, rhs }));
  });
  const grammar: Grammar = { start: startVariable, productions };
  if (!VARIABLE_PATTERN.test(startVariable)) {
    issues.push({ level: "error", message: "The initial state could not be mapped to a valid uppercase variable." });
  }
  if (nfa.states.some((state) => !productionMap.has(variableMap[state.id]))) {
    issues.push({ level: "info", message: "States with neither outgoing transitions nor final status receive no productions; they cannot contribute to a successful derivation." });
  }
  return { grammar, steps, issues, variableMap };
}

export function alphabetOf(nfa: Nfa, grammar?: Grammar): string[] {
  const fromNfa = nfa.transitions
    .map((transition) => compactExpression(transition.label))
    .filter((label) => !isEpsilonMarker(label))
    .flatMap((label) => label.split(""))
    .filter((symbol) => /^[a-z0-9#+*()\-_$]$/.test(symbol));
  const fromGrammar = grammar?.productions
    .flatMap((production) => compactExpression(production.rhs).split(""))
    .filter((symbol) => /^[a-z0-9#+*()\-_$]$/.test(symbol)) ?? [];
  return Array.from(new Set([...fromGrammar, ...fromNfa])).sort();
}

export function enumerateCandidates(alphabet: string[], maxLength = 4, limit = 500): string[] {
  const safeAlphabet = alphabet.filter((symbol) => symbol.length === 1).slice(0, 7);
  const effectiveLength = safeAlphabet.length > 4 ? Math.min(maxLength, 3) : maxLength;
  const result = [""];
  if (safeAlphabet.length === 0) return result;
  let frontier = [""];
  for (let length = 1; length <= effectiveLength; length += 1) {
    const next: string[] = [];
    for (const prefix of frontier) {
      for (const symbol of safeAlphabet) {
        next.push(prefix + symbol);
        if (result.length + next.length >= limit) return [...result, ...next].slice(0, limit);
      }
    }
    result.push(...next);
    frontier = next;
  }
  return result;
}

export function languageExamples(nfa: Nfa, alphabet: string[], maxLength = 4) {
  const candidates = enumerateCandidates(alphabet, maxLength, 500);
  const accepted: string[] = [];
  const rejected: string[] = [];
  for (const candidate of candidates) {
    const result = simulateNfa(nfa, candidate);
    if (result.accepted) accepted.push(candidate || LAMBDA);
    else rejected.push(candidate || LAMBDA);
  }
  return { accepted, rejected, tested: candidates.length };
}

export function grammarNfaAgreement(grammar: Grammar, nfa: Nfa, alphabet: string[]) {
  const candidates = enumerateCandidates(alphabet, 3, 45);
  let matches = 0;
  const mismatches: string[] = [];
  for (const candidate of candidates) {
    const automatonAnswer = simulateNfa(nfa, candidate).accepted;
    const grammarAnswer = deriveWord(grammar, candidate, 12).accepted;
    if (automatonAnswer === grammarAnswer) matches += 1;
    else mismatches.push(candidate || LAMBDA);
  }
  return { tested: candidates.length, matches, mismatches, bounded: true };
}

export function makeDemoNfa(): Nfa {
  const states: NfaState[] = [
    { id: "demo:q0", label: "q0", kind: "variable" },
    { id: "demo:q1", label: "q1", kind: "variable" },
    { id: "demo:f", label: "F", kind: "final" },
  ];
  const transitions: NfaTransition[] = [
    { id: uid("demo"), from: "demo:q0", to: "demo:q0", label: "a" },
    { id: uid("demo"), from: "demo:q0", to: "demo:q1", label: "b" },
    { id: uid("demo"), from: "demo:q1", to: "demo:q1", label: "b" },
    { id: uid("demo"), from: "demo:q1", to: "demo:f", label: LAMBDA },
  ];
  return { states, transitions, startId: "demo:q0", finalIds: ["demo:f"] };
}

export function shortestDerivationSummary(grammar: Grammar, word: string): string {
  const result = deriveWord(grammar, word, 14);
  if (!result.accepted) return "No bounded derivation found.";
  return result.derivation.map((step) => step.form || LAMBDA).join(" ⇒ ");
}

export function boundedTerminalLength(form: string): number {
  return terminalLength(form);
}
