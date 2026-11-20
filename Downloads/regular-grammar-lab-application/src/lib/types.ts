export const LAMBDA = "λ";

export type Production = {
  id: string;
  lhs: string;
  rhs: string;
};

export type Grammar = {
  start: string;
  productions: Production[];
};

export type SymbolToken = {
  value: string;
  kind: "terminal" | "variable";
};

export type Orientation = "right" | "left" | "both" | "none";

export type ParsedProduction = {
  id: string;
  lhs: string;
  rhs: string;
  tokens: SymbolToken[];
  orientation: Orientation;
  variable?: string;
  terminalString: string;
  isEpsilon: boolean;
  description: string;
};

export type IssueLevel = "error" | "warning" | "info";

export type Issue = {
  level: IssueLevel;
  message: string;
  productionId?: string;
};

export type ClassificationKind =
  | "right-linear"
  | "left-linear"
  | "both"
  | "mixed"
  | "non-regular"
  | "invalid";

export type Analysis = {
  valid: boolean;
  kind: ClassificationKind;
  label: string;
  summary: string;
  variables: string[];
  terminals: string[];
  productions: ParsedProduction[];
  issues: Issue[];
  convertible: boolean;
};

export type NfaState = {
  id: string;
  label: string;
  kind: "variable" | "intermediate" | "final";
};

export type NfaTransition = {
  id: string;
  from: string;
  to: string;
  label: string;
};

export type Nfa = {
  states: NfaState[];
  transitions: NfaTransition[];
  startId: string;
  finalIds: string[];
};

export type ConversionResult = {
  nfa: Nfa | null;
  steps: string[];
  stepHighlights: string[][];
  error: string | null;
};

export type DerivationStep = {
  form: string;
  rule: string | null;
  variable: string | null;
  explanation: string;
};

export type GeneratedString = {
  value: string;
  display: string;
  derivation: DerivationStep[];
  depth: number;
};

export type GenerationResult = {
  strings: GeneratedString[];
  explored: number;
  truncated: boolean;
  error: string | null;
};

export type SimulationStep = {
  index: number;
  consumed: string | null;
  before: string[];
  taken: string[];
  after: string[];
  note: string;
};

export type SimulationResult = {
  steps: SimulationStep[];
  accepted: boolean;
  input: string;
  message: string;
  completedInput: boolean;
};

export type ReverseResult = {
  grammar: Grammar;
  steps: string[];
  issues: Issue[];
  variableMap: Record<string, string>;
};

export type SectionId =
  | "dashboard"
  | "builder"
  | "classification"
  | "conversion"
  | "simulator"
  | "generator"
  | "derivation"
  | "reverse"
  | "language"
  | "learning"
  | "quiz"
  | "about";
