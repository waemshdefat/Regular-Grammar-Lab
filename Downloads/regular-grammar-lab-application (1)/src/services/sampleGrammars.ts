export interface SampleGrammar {
  id: string;
  name: string;
  typeBadge: 'Right-Linear' | 'Left-Linear' | 'Mixed Linear' | 'Context-Free';
  description: string;
  languageDesc: string;
  rawText: string;
  startSymbol: string;
  suggestedInputs: { input: string; expected: boolean }[];
}

export const SAMPLE_GRAMMARS: SampleGrammar[] = [
  {
    id: 'sample-1',
    name: 'Strings Ending with "a" (ab)*a',
    typeBadge: 'Right-Linear',
    description: 'Generates strings of alternating (ab) pairs ending with an "a": a, aba, ababa, etc.',
    languageDesc: 'L(G) = { (ab)ⁿa | n ≥ 0 } over Σ = {a, b}',
    rawText: `S -> aA
A -> bS | λ`,
    startSymbol: 'S',
    suggestedInputs: [
      { input: 'a', expected: true },
      { input: 'aba', expected: true },
      { input: 'ababa', expected: true },
      { input: 'ab', expected: false },
      { input: 'b', expected: false },
      { input: 'λ', expected: false }
    ]
  },
  {
    id: 'sample-2',
    name: 'Binary Strings Ending in "01"',
    typeBadge: 'Right-Linear',
    description: 'Generates binary strings ending specifically in "01": (0 + 1)* 01',
    languageDesc: 'L(G) = { w01 | w ∈ {0, 1}* }',
    rawText: `S -> 0S | 1S | 0A
A -> 1B
B -> λ`,
    startSymbol: 'S',
    suggestedInputs: [
      { input: '01', expected: true },
      { input: '101', expected: true },
      { input: '001', expected: true },
      { input: '11001', expected: true },
      { input: '0', expected: false },
      { input: '10', expected: false }
    ]
  },
  {
    id: 'sample-3',
    name: 'Even Number of "a"s over {a, b}',
    typeBadge: 'Right-Linear',
    description: 'Generates any sequence of characters from {a, b} containing an even count of "a"s.',
    languageDesc: 'L(G) = { w ∈ {a, b}* | |w|ₐ is even }',
    rawText: `S -> aA | bS | λ
A -> aS | bA`,
    startSymbol: 'S',
    suggestedInputs: [
      { input: 'λ', expected: true },
      { input: 'b', expected: true },
      { input: 'aa', expected: true },
      { input: 'babab', expected: true },
      { input: 'a', expected: false },
      { input: 'baa', expected: true },
      { input: 'aaa', expected: false }
    ]
  },
  {
    id: 'sample-4',
    name: 'Multi-Terminal Expansion (abA | cd)',
    typeBadge: 'Right-Linear',
    description: 'Demonstrates right-linear production decomposition with terminal sequences into intermediate states.',
    languageDesc: 'L(G) = { (ab)ⁿcd | n ≥ 0 } over Σ = {a, b, c, d}',
    rawText: `S -> abS | cd`,
    startSymbol: 'S',
    suggestedInputs: [
      { input: 'cd', expected: true },
      { input: 'abcd', expected: true },
      { input: 'ababcd', expected: true },
      { input: 'ab', expected: false },
      { input: 'c', expected: false }
    ]
  },
  {
    id: 'sample-5',
    name: 'Left-Linear: Strings ending in "abb"',
    typeBadge: 'Left-Linear',
    description: 'A pure Left-Linear grammar where variables appear on the left: A → Bx or A → x.',
    languageDesc: 'L(G) = { wabb | w ∈ {a, b}* }',
    rawText: `S -> Aa | Bb | abb
A -> Sa | a
B -> Sb | b`,
    startSymbol: 'S',
    suggestedInputs: [
      { input: 'abb', expected: true },
      { input: 'aabb', expected: true },
      { input: 'babb', expected: true }
    ]
  },
  {
    id: 'sample-6',
    name: 'Left-Linear: Binary Strings ending in "00"',
    typeBadge: 'Left-Linear',
    description: 'Left-Linear formulation for (0 + 1)* 00.',
    languageDesc: 'L(G) = { w00 | w ∈ {0, 1}* }',
    rawText: `S -> A0
A -> S0 | S1 | 0`,
    startSymbol: 'S',
    suggestedInputs: [
      { input: '00', expected: true },
      { input: '100', expected: true },
      { input: '0100', expected: true },
      { input: '01', expected: false }
    ]
  },
  {
    id: 'sample-7',
    name: 'Mixed Linear (Non-Regular Counterexample)',
    typeBadge: 'Mixed Linear',
    description: 'Mixes Right-Linear (S → aA) and Left-Linear (A → Sb). While every rule has ≤ 1 variable, the grammar is NOT Regular.',
    languageDesc: 'L(G) = { aⁿbⁿ | n ≥ 1 } (Classic non-regular language!)',
    rawText: `S -> aA
A -> Sb | b`,
    startSymbol: 'S',
    suggestedInputs: [
      { input: 'ab', expected: true },
      { input: 'aabb', expected: true },
      { input: 'aaabbb', expected: true },
      { input: 'aab', expected: false }
    ]
  },
  {
    id: 'sample-8',
    name: 'Context-Free Non-Regular (aⁿbⁿ)',
    typeBadge: 'Context-Free',
    description: 'Standard textbook CFG with flanking terminals (S → aSb | λ). Requires pushdown store.',
    languageDesc: 'L(G) = { aⁿbⁿ | n ≥ 0 }',
    rawText: `S -> aSb | λ`,
    startSymbol: 'S',
    suggestedInputs: [
      { input: 'λ', expected: true },
      { input: 'ab', expected: true },
      { input: 'aabb', expected: true },
      { input: 'a', expected: false }
    ]
  }
];
