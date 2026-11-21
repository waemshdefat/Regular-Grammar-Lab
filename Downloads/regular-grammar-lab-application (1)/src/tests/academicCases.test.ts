import { describe, it, expect } from 'vitest';
import { parseGrammarFromText } from '../services/grammarParser';
import { classifyGrammar } from '../services/grammarClassifier';
import { convertGrammarToNfa, convertRightLinearToNfa, convertLeftLinearToNfa } from '../services/grammarToNfa';
import { simulateNFA } from '../services/nfaSimulator';
import { findDerivationForString, generateStringsFromGrammar } from '../services/stringGenerator';
import { convertNfaToRegularGrammar } from '../services/nfaToGrammar';

describe('Academic Scientific Test Cases for Regular Grammar Lab', () => {
  // Case 1: S → aS | b
  describe('Case 1: S → aS | b (Right-Linear Regular)', () => {
    const raw = `S -> aS | b`;
    const { grammar, errors } = parseGrammarFromText(raw);

    it('parses grammar without errors', () => {
      expect(errors).toHaveLength(0);
      expect(grammar.variables).toContain('S');
      expect(grammar.terminals).toContain('a');
      expect(grammar.terminals).toContain('b');
    });

    it('classifies as Right-Linear (Regular)', () => {
      const result = classifyGrammar(grammar);
      expect(result.type).toBe('RIGHT_LINEAR');
      expect(result.isRegular).toBe(true);
      expect(result.isRightLinear).toBe(true);
      expect(result.isLeftLinear).toBe(false);
    });

    it('converts to NFA and accepts a*b, rejects other strings', () => {
      const nfa = convertRightLinearToNfa(grammar);
      expect(nfa.states.length).toBeGreaterThan(0);

      // Accepted strings: b, ab, aab
      expect(simulateNFA(nfa, 'b').accepted).toBe(true);
      expect(simulateNFA(nfa, 'ab').accepted).toBe(true);
      expect(simulateNFA(nfa, 'aab').accepted).toBe(true);

      // Rejected strings: λ, a, ba
      expect(simulateNFA(nfa, '').accepted).toBe(false);
      expect(simulateNFA(nfa, 'a').accepted).toBe(false);
      expect(simulateNFA(nfa, 'ba').accepted).toBe(false);
    });

    it('generates derivation for valid strings', () => {
      const derivation = findDerivationForString(grammar, 'ab');
      expect(derivation).not.toBeNull();
      expect(derivation!.length).toBe(2);
    });
  });

  // Case 2: S → Sa | b
  describe('Case 2: S → Sa | b (Left-Linear Regular)', () => {
    const raw = `S -> Sa | b`;
    const { grammar, errors } = parseGrammarFromText(raw);

    it('parses grammar without errors', () => {
      expect(errors).toHaveLength(0);
      expect(grammar.variables).toContain('S');
      expect(grammar.terminals).toEqual(['a', 'b']);
    });

    it('classifies as Left-Linear (Regular)', () => {
      const result = classifyGrammar(grammar);
      expect(result.type).toBe('LEFT_LINEAR');
      expect(result.isRegular).toBe(true);
      expect(result.isLeftLinear).toBe(true);
      expect(result.isRightLinear).toBe(false);
    });

    it('converts via Left-Linear Dual algorithm to NFA and accepts ba*, rejects other strings', () => {
      const nfa = convertLeftLinearToNfa(grammar);
      expect(nfa.states.length).toBeGreaterThan(0);

      // Accepted strings: b, ba, baa
      expect(simulateNFA(nfa, 'b').accepted).toBe(true);
      expect(simulateNFA(nfa, 'ba').accepted).toBe(true);
      expect(simulateNFA(nfa, 'baa').accepted).toBe(true);

      // Rejected strings: λ, a, ab
      expect(simulateNFA(nfa, '').accepted).toBe(false);
      expect(simulateNFA(nfa, 'a').accepted).toBe(false);
      expect(simulateNFA(nfa, 'ab').accepted).toBe(false);
    });

    it('finds derivation for left-linear strings', () => {
      const derivation = findDerivationForString(grammar, 'ba');
      expect(derivation).not.toBeNull();
    });
  });

  // Case 3: S → aS | Sb
  describe('Case 3: S → aS | Sb (Mixed Linear, Non-Regular)', () => {
    const raw = `S -> aS | Sb`;
    const { grammar, errors } = parseGrammarFromText(raw);

    it('parses grammar correctly', () => {
      expect(errors).toHaveLength(0);
    });

    it('classifies as Mixed Linear Grammar (Non-Regular)', () => {
      const result = classifyGrammar(grammar);
      expect(result.type).toBe('LINEAR');
      expect(result.isRegular).toBe(false);
      expect(result.isLinear).toBe(true);
      expect(result.isRightLinear).toBe(false);
      expect(result.isLeftLinear).toBe(false);
      expect(result.limitations).toBeDefined();
    });
  });

  // Case 4: S → aSb | ε
  describe('Case 4: S → aSb | ε (Context-Free Linear, Non-Regular {aⁿbⁿ})', () => {
    const raw = `S -> aSb | ε`;
    const { grammar, errors } = parseGrammarFromText(raw);

    it('parses grammar and handles ε symbol', () => {
      expect(errors).toHaveLength(0);
      expect(grammar.productions[0].rhs).toContain('λ');
    });

    it('classifies as Context-Free (Non-Regular) because variable is flanked on both sides', () => {
      const result = classifyGrammar(grammar);
      expect(result.type).toBe('CONTEXT_FREE');
      expect(result.isRegular).toBe(false);
      expect(result.summary).toContain('Context-Free');
    });
  });

  // Case 5: S → abA | a, A → bc
  describe('Case 5: S → abA | a, A → bc (Right-Linear with Multi-Terminal Sequences)', () => {
    const raw = `S -> abA | a\nA -> bc`;
    const { grammar, errors } = parseGrammarFromText(raw);

    it('parses multiple variables and multi-character productions', () => {
      expect(errors).toHaveLength(0);
      expect(grammar.variables).toEqual(['A', 'S']);
      expect(grammar.terminals).toEqual(['a', 'b', 'c']);
    });

    it('classifies as Right-Linear (Regular)', () => {
      const result = classifyGrammar(grammar);
      expect(result.isRegular).toBe(true);
      expect(result.isRightLinear).toBe(true);
    });

    it('converts to NFA inserting intermediate states and accepts { a, abbc }', () => {
      const nfa = convertRightLinearToNfa(grammar);
      // intermediate states should have been synthesized
      const intermediateStates = nfa.states.filter(s => s.isIntermediate);
      expect(intermediateStates.length).toBeGreaterThan(0);

      // Accepted strings: a, abbc
      expect(simulateNFA(nfa, 'a').accepted).toBe(true);
      expect(simulateNFA(nfa, 'abbc').accepted).toBe(true);

      // Rejected strings: λ, ab, abc, b, c
      expect(simulateNFA(nfa, '').accepted).toBe(false);
      expect(simulateNFA(nfa, 'ab').accepted).toBe(false);
      expect(simulateNFA(nfa, 'abc').accepted).toBe(false);
      expect(simulateNFA(nfa, 'b').accepted).toBe(false);
    });
  });

  // Case 6: S → A, A → a
  describe('Case 6: S → A, A → a (Unit Production + Terminal)', () => {
    const raw = `S -> A\nA -> a`;
    const { grammar, errors } = parseGrammarFromText(raw);

    it('parses unit production cleanly', () => {
      expect(errors).toHaveLength(0);
    });

    it('classifies unit production as compatible with Regular grammar (does not cause mixed linear)', () => {
      const result = classifyGrammar(grammar);
      expect(result.isRegular).toBe(true);
      expect(result.type).toBe('RIGHT_LINEAR');
    });

    it('converts to NFA and accepts "a"', () => {
      const nfa = convertGrammarToNfa(grammar);
      expect(simulateNFA(nfa, 'a').accepted).toBe(true);
      expect(simulateNFA(nfa, 'b').accepted).toBe(false);
      expect(simulateNFA(nfa, '').accepted).toBe(false);
    });
  });

  // Case 7: S → ε
  describe('Case 7: S → ε (Epsilon Language {λ})', () => {
    const raw = `S -> ε`;
    const { grammar, errors } = parseGrammarFromText(raw);

    it('parses epsilon production and normalizes to canonical λ', () => {
      expect(errors).toHaveLength(0);
      expect(grammar.productions[0].rhs).toContain('λ');
    });

    it('classifies as Regular', () => {
      const result = classifyGrammar(grammar);
      expect(result.isRegular).toBe(true);
    });

    it('converts to NFA where start state is accepting and accepts only λ', () => {
      const nfa = convertGrammarToNfa(grammar);
      expect(simulateNFA(nfa, '').accepted).toBe(true);
      expect(simulateNFA(nfa, 'λ').accepted).toBe(true);
      expect(simulateNFA(nfa, 'a').accepted).toBe(false);
    });
  });

  // Case 8: S → aA, A → bA | ε
  describe('Case 8: S → aA, A → bA | ε (Language a b*)', () => {
    const raw = `S -> aA\nA -> bA | ε`;
    const { grammar, errors } = parseGrammarFromText(raw);

    it('parses without errors', () => {
      expect(errors).toHaveLength(0);
    });

    it('classifies as Right-Linear (Regular)', () => {
      const result = classifyGrammar(grammar);
      expect(result.type).toBe('RIGHT_LINEAR');
      expect(result.isRegular).toBe(true);
    });

    it('converts to NFA and accepts a, ab, abb; rejects λ, b, ba', () => {
      const nfa = convertRightLinearToNfa(grammar);
      expect(simulateNFA(nfa, 'a').accepted).toBe(true);
      expect(simulateNFA(nfa, 'ab').accepted).toBe(true);
      expect(simulateNFA(nfa, 'abb').accepted).toBe(true);

      expect(simulateNFA(nfa, '').accepted).toBe(false);
      expect(simulateNFA(nfa, 'b').accepted).toBe(false);
      expect(simulateNFA(nfa, 'ba').accepted).toBe(false);
    });

    it('generates strings matching a b*', () => {
      const generated = generateStringsFromGrammar(grammar, 5, 10);
      const strings = generated.map(g => g.str);
      expect(strings).toContain('a');
      expect(strings).toContain('ab');
    });
  });

  // Case 9: S → a | b
  describe('Case 9: S → a | b (Finite Language {a, b})', () => {
    const raw = `S -> a | b`;
    const { grammar, errors } = parseGrammarFromText(raw);

    it('parses multiple terminal alternatives', () => {
      expect(errors).toHaveLength(0);
      expect(grammar.terminals).toEqual(['a', 'b']);
    });

    it('classifies as Regular (Finite Language)', () => {
      const result = classifyGrammar(grammar);
      expect(result.isRegular).toBe(true);
    });

    it('converts to NFA and accepts "a" and "b", rejects others', () => {
      const nfa = convertGrammarToNfa(grammar);
      expect(simulateNFA(nfa, 'a').accepted).toBe(true);
      expect(simulateNFA(nfa, 'b').accepted).toBe(true);
      expect(simulateNFA(nfa, 'ab').accepted).toBe(false);
      expect(simulateNFA(nfa, '').accepted).toBe(false);
    });
  });

  // Case 10: S → AB, A → a, B → b
  describe('Case 10: S → AB, A → a, B → b (Context-Free Non-Linear)', () => {
    const raw = `S -> AB\nA -> a\nB -> b`;
    const { grammar, errors } = parseGrammarFromText(raw);

    it('parses multiple non-terminals in single RHS', () => {
      expect(errors).toHaveLength(0);
      expect(grammar.variables).toEqual(['A', 'B', 'S']);
    });

    it('classifies as Context-Free (Non-Regular) due to S → AB', () => {
      const result = classifyGrammar(grammar);
      expect(result.type).toBe('CONTEXT_FREE');
      expect(result.isRegular).toBe(false);
      expect(result.isLinear).toBe(false);
    });
  });

  // Additional Test: NFA to Grammar Reverse Mapping
  describe('Reverse Conversion: NFA to Right-Linear Grammar', () => {
    it('converts NFA correctly without state-to-variable collisions', () => {
      const sampleNfa = {
        states: [
          { id: 'q0', label: 'q₀', isInitial: true, isFinal: false },
          { id: 'q1', label: 'q₁', isInitial: false, isFinal: false },
          { id: 'q2', label: 'q₂', isInitial: false, isFinal: true }
        ],
        alphabet: ['a', 'b'],
        transitions: [
          { from: 'q0', to: 'q1', symbol: 'a' },
          { from: 'q1', to: 'q2', symbol: 'b' }
        ],
        initialStateId: 'q0',
        finalStateIds: ['q2'],
        conversionSteps: []
      };

      const result = convertNfaToRegularGrammar(sampleNfa);
      // Ensure all 3 states map to unique variable letters
      const mappedVars = Object.values(result.stateToVariableMap);
      const uniqueVars = new Set(mappedVars);
      expect(uniqueVars.size).toBe(3);
      expect(result.stateToVariableMap['q0']).toBe('S');
      expect(result.stateToVariableMap['q1']).toBe('A');
      expect(result.stateToVariableMap['q2']).toBe('B');

      // Final state q2 has B -> λ
      const bRule = result.grammar.productions.find(p => p.lhs === 'B');
      expect(bRule?.rhs).toContain('λ');
    });
  });
});
