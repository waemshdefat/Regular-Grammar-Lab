// Formal Type Definitions for Regular Grammar Lab

export type GrammarType =
  | 'RIGHT_LINEAR'
  | 'LEFT_LINEAR'
  | 'LINEAR'
  | 'CONTEXT_FREE'
  | 'INVALID';

export interface ProductionRule {
  id: string;
  lhs: string; // Left-hand side variable (e.g. "S")
  rhs: string[]; // Right-hand side alternatives (e.g. ["aA", "b"])
}

export interface Grammar {
  variables: string[]; // V (non-terminals)
  terminals: string[]; // Σ (terminals)
  productions: ProductionRule[]; // R (production rules)
  startSymbol: string; // S
}

export interface RuleClassification {
  ruleStr: string;
  lhs: string;
  rhsPart: string;
  category: 'RIGHT_LINEAR' | 'LEFT_LINEAR' | 'TERMINAL_ONLY' | 'EPSILON' | 'UNIT_PRODUCTION' | 'NON_LINEAR' | 'INVALID';
  explanation: string;
}

export interface GrammarClassificationResult {
  type: GrammarType;
  typeName: string;
  isRegular: boolean;
  isRightLinear: boolean;
  isLeftLinear: boolean;
  isLinear: boolean;
  ruleBreakdown: RuleClassification[];
  summary: string;
  notes: string[];
  limitations?: string;
}

// NFA Definitions
export interface NFAState {
  id: string; // e.g. "q_S", "q_A", "q_f"
  label: string; // e.g. "S", "A", "q_accept"
  isInitial: boolean;
  isFinal: boolean;
  isIntermediate?: boolean;
  x?: number;
  y?: number;
}

export interface NFATransition {
  from: string; // State ID
  to: string; // State ID
  symbol: string; // Terminal symbol or "λ" / "ε"
  ruleOrigin?: string; // Originating production rule for explanation
}

export interface NFA {
  states: NFAState[];
  alphabet: string[];
  transitions: NFATransition[];
  initialStateId: string;
  finalStateIds: string[];
  conversionSteps: NFAConversionStep[];
}

export interface NFAConversionStep {
  stepNumber: number;
  rule: string;
  action: string;
  addedStates: string[];
  addedTransitions: string[];
  explanation: string;
}

// Simulation Types
export interface SimulationStep {
  stepIndex: number;
  currentSymbol: string | null;
  remainingInput: string;
  activeStateIds: string[];
  executedTransitions: NFATransition[];
  description: string;
}

export interface SimulationResult {
  inputString: string;
  accepted: boolean;
  steps: SimulationStep[];
  finalStateIds: string[];
  reason: string;
}

// Derivation Types
export interface DerivationStep {
  sententialForm: string;
  replacedVariable: string;
  ruleApplied: string;
  indexInString: number;
  nextForm: string;
}

export interface GeneratedString {
  str: string;
  length: number;
  derivation: DerivationStep[];
  rulesUsed: string[];
}

// Educational Quiz Types
export interface QuizQuestion {
  id: string;
  category: 'classification' | 'conversion' | 'nfa-to-grammar' | 'acceptance' | 'theory';
  title: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  codeSnippet?: string;
}
