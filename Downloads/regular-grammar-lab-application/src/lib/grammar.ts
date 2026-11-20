import {
  LAMBDA,
  type Analysis,
  type ClassificationKind,
  type DerivationStep,
  type GeneratedString,
  type GenerationResult,
  type Grammar,
  type Issue,
  type ParsedProduction,
  type Production,
  type SymbolToken,
} from "./types";

let counter = 0;
export function uid(prefix = "id"): string {
  counter += 1;
  return `${prefix}-${counter.toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export const VARIABLE_PATTERN = /^[A-Z][A-Z0-9]*$/;
const VARIABLE_RUN = /^[A-Z][A-Z0-9]*/;
const EPSILON_WORD = /^(?:λ|ε|Λ|epsilon|lambda|empty|<epsilon>)$/i;

export function compactExpression(value: string): string {
  return value.replace(/\s+/g, "");
}

export function isEpsilonMarker(value: string): boolean {
  const compact = compactExpression(value);
  return compact === "" || compact === '""' || compact === "''" || EPSILON_WORD.test(compact);
}

export function toSententialForm(rhs: string): string {
  const compact = compactExpression(rhs);
  return isEpsilonMarker(compact) ? "" : compact;
}

export function tokenizeExpression(value: string): SymbolToken[] {
  const compact = compactExpression(value);
  if (isEpsilonMarker(compact)) return [];
  const tokens: SymbolToken[] = [];
  let i = 0;
  while (i < compact.length) {
    const rest = compact.slice(i);
    if (/[A-Z]/.test(compact[i])) {
      const match = rest.match(VARIABLE_RUN);
      if (match) {
        tokens.push({ value: match[0], kind: "variable" });
        i += match[0].length;
        continue;
      }
    }
    tokens.push({ value: compact[i], kind: "terminal" });
    i += 1;
  }
  return tokens;
}

export function findVariables(form: string): { value: string; index: number }[] {
  const result: { value: string; index: number }[] = [];
  const expression = /[A-Z][A-Z0-9]*/g;
  let match: RegExpExecArray | null;
  while ((match = expression.exec(form)) !== null) {
    result.push({ value: match[0], index: match.index });
  }
  return result;
}

export function terminalLength(form: string): number {
  return form.replace(/[A-Z][A-Z0-9]*/g, "").length;
}

export function formatProduction(production: Production): string {
  const rhs = compactExpression(production.rhs);
  return `${compactExpression(production.lhs) || "?"} → ${isEpsilonMarker(rhs) ? LAMBDA : rhs || LAMBDA}`;
}

export function grammarToText(grammar: Grammar): string {
  const grouped = new Map<string, string[]>();
  for (const production of grammar.productions) {
    const lhs = compactExpression(production.lhs) || "?";
    const rhs = compactExpression(production.rhs) || LAMBDA;
    const alternatives = grouped.get(lhs) ?? [];
    alternatives.push(isEpsilonMarker(rhs) ? LAMBDA : rhs);
    grouped.set(lhs, alternatives);
  }
  const order = [grammar.start, ...Array.from(grouped.keys()).filter((key) => key !== grammar.start)];
  return order
    .filter((key) => grouped.has(key))
    .map((key) => `${key} → ${(grouped.get(key) ?? []).join(" | ")}`)
    .join("\n");
}

export function parseGrammarText(
  text: string,
  start = "S",
): { grammar: Grammar; errors: string[] } {
  const productions: Production[] = [];
  const errors: string[] = [];
  const lines = text.split(/\r?\n/);
  for (let lineNumber = 0; lineNumber < lines.length; lineNumber += 1) {
    const line = lines[lineNumber].trim();
    if (!line || line.startsWith("#") || line.startsWith("//")) continue;
    const candidates = [
      { index: line.indexOf("→"), length: 1 },
      { index: line.indexOf("->"), length: 2 },
      { index: line.indexOf(":"), length: 1 },
    ]
      .filter((candidate) => candidate.index >= 0)
      .sort((a, b) => a.index - b.index);
    const separator = candidates[0];
    if (!separator) {
      errors.push(`Line ${lineNumber + 1}: expected an arrow (→ or ->) between the variable and its alternatives.`);
      continue;
    }
    const lhs = line.slice(0, separator.index).trim();
    const rhs = line.slice(separator.index + separator.length).trim();
    if (!VARIABLE_PATTERN.test(lhs)) {
      errors.push(`Line ${lineNumber + 1}: "${lhs}" is not a valid variable name (use an uppercase letter, optionally followed by digits).`);
      continue;
    }
    for (const alternative of rhs.split("|")) {
      const clean = alternative.trim();
      if (clean) productions.push({ id: uid("p"), lhs, rhs: clean });
    }
  }
  return { grammar: { start, productions }, errors };
}

function describeParsedProduction(
  lhs: string,
  tokens: SymbolToken[],
  orientation: ParsedProduction["orientation"],
  variable: string | undefined,
  terminalString: string,
): string {
  if (tokens.length === 0) {
    return `${lhs} → ${LAMBDA}: an ε-production; the derivation can terminate here.`;
  }
  if (orientation === "none") {
    const variableCount = tokens.filter((token) => token.kind === "variable").length;
    if (variableCount > 1) {
      return `The right-hand side contains ${variableCount} variables. A linear grammar permits at most one variable.`;
    }
    return `The variable is in an interior position. A regular grammar requires it at the right end (A → xB) or left end (A → Bx).`;
  }
  if (orientation === "right") {
    return `Right-linear form ${lhs} → x${variable}, with x = ${terminalString || LAMBDA}.`;
  }
  if (orientation === "left") {
    return `Left-linear form ${lhs} → ${variable}x, with x = ${terminalString || LAMBDA}.`;
  }
  if (variable) {
    return `Unit production ${lhs} → ${variable}: it satisfies both A → xB and A → Bx with x = ${LAMBDA}.`;
  }
  return `Terminal-only production ${lhs} → ${terminalString}: it is compatible with both linear forms.`;
}

export function analyzeGrammar(grammar: Grammar): Analysis {
  const issues: Issue[] = [];
  const variables = new Set<string>();
  const terminals = new Set<string>();
  const lhsSet = new Set<string>();
  const parsed: ParsedProduction[] = [];
  const start = compactExpression(grammar.start);
  let syntaxErrors = 0;
  const addSyntaxError = (issue: Issue) => {
    syntaxErrors += 1;
    issues.push(issue);
  };

  if (VARIABLE_PATTERN.test(start)) variables.add(start);
  else addSyntaxError({ level: "error", message: `The start symbol "${grammar.start || "∅"}" must be an uppercase variable such as S.` });

  if (grammar.productions.length === 0) {
    addSyntaxError({ level: "error", message: "The grammar has no production rules. Add at least one rule to begin." });
  }

  for (const production of grammar.productions) {
    const lhs = compactExpression(production.lhs);
    const rhs = compactExpression(production.rhs);
    if (!VARIABLE_PATTERN.test(lhs)) {
      addSyntaxError({
        level: "error",
        productionId: production.id,
        message: `"${production.lhs || "∅"}" is not a valid left-hand side. Variables must begin with an uppercase letter and contain only digits after it.`,
      });
    } else {
      variables.add(lhs);
      lhsSet.add(lhs);
    }
    if (/[→|]/.test(rhs) || rhs.includes("->")) {
      addSyntaxError({
        level: "error",
        productionId: production.id,
        message: `"${production.rhs}" contains an arrow or alternative separator. Enter one alternative per row, or use "Paste rules" to split them.`,
      });
    }
    const tokens = tokenizeExpression(rhs);
    for (const token of tokens) {
      if (token.kind === "variable") variables.add(token.value);
      else terminals.add(token.value);
    }
    const variablePositions = tokens
      .map((token, index) => ({ token, index }))
      .filter((entry) => entry.token.kind === "variable");
    let orientation: ParsedProduction["orientation"] = "both";
    let variable: string | undefined;
    let terminalString = tokens.map((token) => token.value).join("");
    if (tokens.length === 0) {
      orientation = "both";
      terminalString = "";
    } else if (variablePositions.length > 1) {
      orientation = "none";
    } else if (variablePositions.length === 1) {
      const entry = variablePositions[0];
      variable = entry.token.value;
      if (entry.index === tokens.length - 1 && entry.index !== 0) {
        orientation = "right";
        terminalString = tokens.slice(0, entry.index).map((token) => token.value).join("");
      } else if (entry.index === 0 && tokens.length > 1) {
        orientation = "left";
        terminalString = tokens.slice(1).map((token) => token.value).join("");
      } else if (tokens.length === 1) {
        orientation = "both";
        terminalString = "";
      } else {
        orientation = "none";
      }
    } else {
      orientation = "both";
    }
    const item: ParsedProduction = {
      id: production.id,
      lhs,
      rhs,
      tokens,
      orientation,
      variable,
      terminalString,
      isEpsilon: tokens.length === 0,
      description: describeParsedProduction(lhs || "?", tokens, orientation, variable, terminalString),
    };
    parsed.push(item);
    if (orientation === "none") {
      issues.push({ level: "error", productionId: production.id, message: `${formatProduction(production)}: ${item.description}` });
    }
  }

  for (const variable of variables) {
    if (!lhsSet.has(variable)) {
      issues.push({
        level: "warning",
        message: `Variable ${variable} has no productions. It can be used in a derivation but cannot be rewritten further.`,
      });
    }
  }

  if (VARIABLE_PATTERN.test(start) && !lhsSet.has(start)) {
    addSyntaxError({ level: "error", message: `The start symbol ${start} has no production rule.` });
  }

  const startHasEpsilon = parsed.some((item) => item.lhs === start && item.isEpsilon);
  const startOccursOnRhs = parsed.some((item) => item.tokens.some((token) => token.kind === "variable" && token.value === start));
  if (startHasEpsilon && startOccursOnRhs) {
    issues.push({
      level: "warning",
      message: `Strict textbook convention allows ${start} → ${LAMBDA} only when ${start} never occurs on a right-hand side. Here ${start} does occur on a right-hand side; the language is still regular, but an equivalent ε-free grammar should remove that occurrence.`,
    });
  }
  if (parsed.some((item) => item.orientation === "both" && item.variable)) {
    issues.push({ level: "info", message: `Unit productions (A → B) are treated as ${LAMBDA}-transitions by the NFA construction.` });
  }
  if (parsed.some((item) => item.terminalString.length > 1 && item.orientation !== "none")) {
    issues.push({ level: "info", message: "A terminal string x ∈ T* on a linear production is split into a chain of intermediate NFA states during conversion." });
  }

  const hasErrors = syntaxErrors > 0;
  const hasInvalid = parsed.some((item) => item.orientation === "none");
  const hasRight = parsed.some((item) => item.orientation === "right");
  const hasLeft = parsed.some((item) => item.orientation === "left");
  let kind: ClassificationKind = "right-linear";
  if (hasErrors) kind = "invalid";
  else if (hasInvalid) kind = "non-regular";
  else if (hasRight && hasLeft) kind = "mixed";
  else if (hasRight) kind = "right-linear";
  else if (hasLeft) kind = "left-linear";
  else kind = "both";

  const labels: Record<ClassificationKind, string> = {
    "right-linear": "Right-Linear Grammar",
    "left-linear": "Left-Linear Grammar",
    both: "Both Forms (Trivial)",
    mixed: "Mixed / Not Regular",
    "non-regular": "Non-Regular Shape",
    invalid: "Invalid Grammar",
  };
  const summaries: Record<ClassificationKind, string> = {
    "right-linear": "Every non-terminal production has its single variable at the right end: A → xB or A → x. It can be converted directly into an NFA.",
    "left-linear": "Every non-terminal production has its single variable at the left end: A → Bx or A → x. Direct construction here follows the right-linear algorithm, so reverse each string or build an equivalent right-linear grammar first.",
    both: "All productions are terminal-only or ε. This finite language satisfies both right- and left-linear definitions and is directly convertible.",
    mixed: "The grammar contains both a right-only and a left-only production. A regular grammar must have one consistent orientation; direct NFA construction is not sound for this mix.",
    "non-regular": "At least one production has multiple variables or a variable in an interior position. This is not a right- or left-linear grammar.",
    invalid: "Fix the syntax or structural errors listed below before classification and conversion can be trusted.",
  };

  if (kind === "mixed") {
    issues.push({
      level: "error",
      message: "Mixing A → xB and A → Bx in one grammar can generate a non-regular language. Unify the orientation (or use reversal to obtain a right-linear grammar for the reversed language) before applying the construction.",
    });
  }
  if (kind === "left-linear") {
    issues.push({
      level: "info",
      message: "For a left-linear grammar G, reverse every right-hand side to obtain a right-linear grammar for L(G)^R. Then construct an NFA for the reversed language and reverse its transitions.",
    });
  }

  const variableList = Array.from(variables).sort((a, b) => {
    if (a === start) return -1;
    if (b === start) return 1;
    return a.localeCompare(b);
  });
  return {
    valid: !hasErrors,
    kind,
    label: labels[kind],
    summary: summaries[kind],
    variables: variableList,
    terminals: Array.from(terminals).sort(),
    productions: parsed,
    issues,
    convertible: !hasErrors && (kind === "right-linear" || kind === "both"),
  };
}

export function generateStrings(
  grammar: Grammar,
  maxDepth: number,
  limit = 12,
): GenerationResult {
  const depth = Math.max(1, Math.min(12, Math.floor(maxDepth)));
  const maximum = Math.max(1, Math.min(20, Math.floor(limit)));
  if (!VARIABLE_PATTERN.test(compactExpression(grammar.start)) || grammar.productions.length === 0) {
    return { strings: [], explored: 0, truncated: false, error: "Add a valid start symbol and at least one production first." };
  }
  const initialStep: DerivationStep = {
    form: compactExpression(grammar.start),
    rule: null,
    variable: null,
    explanation: "Begin the derivation with the start variable.",
  };
  const queue = [{ form: compactExpression(grammar.start), derivation: [initialStep], depth: 0 }];
  const visited = new Set<string>([compactExpression(grammar.start)]);
  const found: GeneratedString[] = [];
  const seenWords = new Set<string>();
  let explored = 0;
  let truncated = false;
  const workLimit = 6000;
  while (queue.length > 0 && explored < workLimit && found.length < maximum * 3) {
    const node = queue.shift()!;
    explored += 1;
    const occurrences = findVariables(node.form);
    if (occurrences.length === 0) {
      if (!seenWords.has(node.form)) {
        seenWords.add(node.form);
        found.push({
          value: node.form,
          display: node.form || LAMBDA,
          derivation: node.derivation,
          depth: node.depth,
        });
      }
      continue;
    }
    if (node.depth >= depth) {
      truncated = true;
      continue;
    }
    for (const occurrence of occurrences) {
      const variable = occurrence.value;
      const prefix = node.form.slice(0, occurrence.index);
      const suffix = node.form.slice(occurrence.index + variable.length);
      for (const production of grammar.productions) {
        if (compactExpression(production.lhs) !== variable) continue;
        const replacement = toSententialForm(production.rhs);
        const nextForm = prefix + replacement + suffix;
        if (nextForm.length > 80 || visited.has(nextForm)) continue;
        visited.add(nextForm);
        queue.push({
          form: nextForm,
          depth: node.depth + 1,
          derivation: [
            ...node.derivation,
            {
              form: nextForm,
              rule: formatProduction(production),
              variable,
              explanation: `Applied ${formatProduction(production)} to ${variable} at position ${occurrence.index + 1}.`,
            },
          ],
        });
      }
    }
  }
  if (explored >= workLimit || queue.length > 0) truncated = true;
  found.sort((a, b) => a.value.length - b.value.length || a.value.localeCompare(b.value));
  return {
    strings: found.slice(0, maximum),
    explored,
    truncated,
    error: found.length === 0 ? "No terminal string was reached within the selected depth. Increase the derivation depth or check recursive rules." : null,
  };
}

export function deriveWord(
  grammar: Grammar,
  rawWord: string,
  maxDepth = 16,
): { accepted: boolean; derivation: DerivationStep[]; reason: string } {
  const word = isEpsilonMarker(rawWord) ? "" : compactExpression(rawWord);
  const startForm = compactExpression(grammar.start);
  if (!VARIABLE_PATTERN.test(startForm)) {
    return { accepted: false, derivation: [], reason: "The grammar has an invalid start symbol." };
  }
  const initial: DerivationStep = {
    form: startForm,
    rule: null,
    variable: null,
    explanation: "Begin with the start variable.",
  };
  const queue = [{ form: startForm, derivation: [initial], depth: 0 }];
  const visited = new Set<string>([startForm]);
  let explored = 0;
  const workLimit = 10000;
  while (queue.length > 0 && explored < workLimit) {
    const node = queue.shift()!;
    explored += 1;
    if (findVariables(node.form).length === 0) {
      if (node.form === word) {
        return { accepted: true, derivation: node.derivation, reason: `A derivation ended in ${word || LAMBDA} after ${node.depth} production(s).` };
      }
      continue;
    }
    if (node.depth >= maxDepth || terminalLength(node.form) > word.length) continue;
    for (const occurrence of findVariables(node.form)) {
      const prefix = node.form.slice(0, occurrence.index);
      const suffix = node.form.slice(occurrence.index + occurrence.value.length);
      for (const production of grammar.productions) {
        if (compactExpression(production.lhs) !== occurrence.value) continue;
        const nextForm = prefix + toSententialForm(production.rhs) + suffix;
        if (visited.has(nextForm) || terminalLength(nextForm) > word.length || nextForm.length > 100) continue;
        visited.add(nextForm);
        queue.push({
          form: nextForm,
          depth: node.depth + 1,
          derivation: [
            ...node.derivation,
            {
              form: nextForm,
              rule: formatProduction(production),
              variable: occurrence.value,
              explanation: `Applied ${formatProduction(production)} to ${occurrence.value}.`,
            },
          ],
        });
      }
    }
  }
  return {
    accepted: false,
    derivation: [],
    reason: `No bounded derivation produced exactly ${word || LAMBDA}. Search depth: ${maxDepth}; forms explored: ${explored}.`,
  };
}
