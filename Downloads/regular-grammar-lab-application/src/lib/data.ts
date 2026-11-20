import { parseGrammarText } from "./grammar";
import type { Grammar } from "./types";

export type Sample = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: "Right-linear" | "Left-linear" | "Mixed" | "Non-regular";
  start: string;
  text: string;
};

export const SAMPLES: Sample[] = [
  {
    id: "classic",
    title: "Brief example",
    subtitle: "S → aA | b ; A → aS | λ",
    description: "The two-variable example from the project brief, with alternatives and an ε-production.",
    category: "Right-linear",
    start: "S",
    text: "S → aA | b\nA → aS | λ",
  },
  {
    id: "a-star",
    title: "Zero or more a's",
    subtitle: "S → aS | λ",
    description: "A compact recursive grammar introducing recursion, λ-closure, and the empty string.",
    category: "Right-linear",
    start: "S",
    text: "S → aS | λ",
  },
  {
    id: "ends-b",
    title: "Strings ending in b",
    subtitle: "S → aS | bS | b",
    description: "A nondeterministic-looking grammar whose productions share the same left-hand side.",
    category: "Right-linear",
    start: "S",
    text: "S → aS | bS | b",
  },
  {
    id: "even-a",
    title: "Even number of a's",
    subtitle: "Two-state parity tracking",
    description: "Variables S and A remember whether the number of a's read so far is even or odd.",
    category: "Right-linear",
    start: "S",
    text: "S → aA | bS | λ\nA → aS | bA",
  },
  {
    id: "terminal-strings",
    title: "Terminal sequences",
    subtitle: "S → abS | aA | λ",
    description: "Uses x ∈ T* productions such as abS, forcing the converter to insert intermediate states.",
    category: "Right-linear",
    start: "S",
    text: "S → abS | aA | λ\nA → bA | b",
  },
  {
    id: "left-linear",
    title: "Left-linear example",
    subtitle: "S → Sa | Sb | a | b",
    description: "All recursive productions place the variable at the left end: A → Bx.",
    category: "Left-linear",
    start: "S",
    text: "S → Sa | Sb | a | b",
  },
  {
    id: "mixed",
    title: "Mixed orientation",
    subtitle: "S → aS | Sb | λ",
    description: "Contains both A → xB and A → Bx. Demonstrates why orientation cannot be mixed.",
    category: "Mixed",
    start: "S",
    text: "S → aS | Sb | λ",
  },
  {
    id: "non-regular",
    title: "Non-linear shape",
    subtitle: "S → aSb | λ",
    description: "The classic aⁿbⁿ grammar: its variable is in an interior position and its language is not regular.",
    category: "Non-regular",
    start: "S",
    text: "S → aSb | λ",
  },
];

export const DEFAULT_SAMPLE_ID = "classic";

export function sampleToGrammar(sampleId: string): Grammar {
  const sample = SAMPLES.find((item) => item.id === sampleId) ?? SAMPLES[0];
  return parseGrammarText(sample.text, sample.start).grammar;
}

export type LessonSection = {
  heading: string;
  body: string;
  formula?: string;
  example?: string;
};

export type Lesson = {
  id: string;
  title: string;
  subtitle: string;
  minutes: number;
  objectives: string[];
  sections: LessonSection[];
  derivation?: string[];
  exercise: {
    question: string;
    options: string[];
    answer: number;
    explanation: string;
  };
  sampleId?: string;
};

export const LESSONS: Lesson[] = [
  {
    id: "linear",
    title: "Linear Grammars",
    subtitle: "At most one variable on a right-hand side",
    minutes: 6,
    objectives: ["Identify variables, terminals, and productions", "Recognise a linear right-hand side", "Explain why A → aSb is not linear"],
    sections: [
      {
        heading: "The building blocks",
        body: "A grammar is G = (V, T, P, S): V is a finite set of variables (uppercase), T is a terminal alphabet (lowercase symbols), P is a finite set of productions, and S ∈ V is the start variable. The empty word is written λ or ε.",
        formula: "G = (V, T, P, S)",
        example: "S → aA | b     V = {S, A}     T = {a, b}",
      },
      {
        heading: "Linearity",
        body: "A production is linear when its right-hand side contains at most one variable. A → aB and A → Ba are linear; A → aBb is not. A linear grammar is not necessarily regular: S → aSb | λ is linear but generates the non-regular language {aⁿbⁿ | n ≥ 0}.",
        formula: "A → xBy   with at most one B ∈ V",
      },
      {
        heading: "Why position matters",
        body: "Regular grammars add a stricter requirement: the sole variable must consistently be at one edge. That restriction is what makes a one-way finite-state construction possible.",
      },
    ],
    derivation: ["S", "aSb", "aaSbb", "aaSbbb", "aabbb"],
    exercise: {
      question: "Which production makes S → aSb | λ non-linear in the regular-grammar sense?",
      options: ["S → λ", "S → aSb, because S is surrounded by terminals", "Both productions", "Neither production"],
      answer: 1,
      explanation: "S → aSb has its variable in an interior position, not at an edge. It is linear in the broad sense (one variable), but not right- or left-linear.",
    },
    sampleId: "non-regular",
  },
  {
    id: "right-linear",
    title: "Right-Linear Grammars",
    subtitle: "The variable stays at the right edge",
    minutes: 7,
    objectives: ["Use the A → xB and A → x forms", "Read x as a terminal string", "Recognise a rightmost derivation"],
    sections: [
      {
        heading: "Definition",
        body: "Every production has one of two shapes: A → xB or A → x, where A, B ∈ V and x ∈ T*. A → λ is the case x = λ. A grammar is right-linear when all productions use this orientation.",
        formula: "A → xB   |   A → x     (x ∈ T*)",
        example: "S → abS | aA | λ      A → bA | b",
      },
      {
        heading: "Derivations grow to the right",
        body: "Because the variable is rightmost, every rewrite extends the terminal prefix. This is exactly how an NFA reads a word from left to right.",
      },
      {
        heading: "Terminal strings are allowed",
        body: "Some textbooks show only one terminal before B. The general form permits x ∈ T*, so A → abB is implemented by splitting ab into two one-symbol transitions through an intermediate state.",
      },
    ],
    derivation: ["S", "abS", "abaA", "ababA", "ababb"],
    exercise: {
      question: "How many intermediate NFA states are needed for A → abcB?",
      options: ["0", "1", "2", "3"],
      answer: 2,
      explanation: "The chain A --a--> q₁ --b--> q₂ --c--> B needs one state between each pair of adjacent terminals: 3 − 1 = 2.",
    },
    sampleId: "terminal-strings",
  },
  {
    id: "left-linear",
    title: "Left-Linear Grammars",
    subtitle: "The variable stays at the left edge",
    minutes: 6,
    objectives: ["Use the A → Bx and A → x forms", "Understand reversal", "Avoid mixing orientations"],
    sections: [
      {
        heading: "Definition",
        body: "Every production has the form A → Bx or A → x, with x ∈ T*. A → λ is allowed when x = λ. The variable is leftmost, so derivations accumulate terminals on the right.",
        formula: "A → Bx   |   A → x     (x ∈ T*)",
        example: "S → Sa | Sb | a | b",
      },
      {
        heading: "Connection to right-linear grammars",
        body: "Reverse each right-hand side of a left-linear grammar G. The resulting right-linear grammar Gᴿ generates L(G)ᴿ, the reversal of the original language. Build an NFA for Gᴿ and reverse its transitions to obtain an NFA for L(G).",
        formula: "L(Gᴿ) = { wᴿ | w ∈ L(G) }",
      },
      {
        heading: "Do not mix",
        body: "A grammar containing both A → xB and A → Bx is not right-linear or left-linear. Such a mix can generate a non-regular language, so the direct NFA construction is unsound.",
      },
    ],
    derivation: ["S", "Sa", "Sba", "aba"],
    exercise: {
      question: "Which grammar is left-linear?",
      options: ["S → aS | λ", "S → Sa | Sb | b", "S → aS | Sb", "S → aSb | λ"],
      answer: 1,
      explanation: "In S → Sa and S → Sb the single variable S is at the left edge; b is terminal-only and compatible with either orientation.",
    },
    sampleId: "left-linear",
  },
  {
    id: "regular-grammar",
    title: "Regular Grammars",
    subtitle: "One consistent linear orientation",
    minutes: 7,
    objectives: ["State the formal regular-grammar definition", "Apply the S → λ convention", "Classify mixed and invalid grammars"],
    sections: [
      {
        heading: "Definition",
        body: "A grammar is regular if it is right-linear or left-linear. It must keep one orientation throughout all productions; terminal-only and λ productions are compatible with both.",
        formula: "Regular ⇔ right-linear OR left-linear",
      },
      {
        heading: "The ε convention",
        body: "In the strict textbook convention, S → λ is allowed only if S does not occur on any right-hand side. The restriction is removable: an equivalent ε-free regular grammar always exists, so the language remains regular.",
      },
      {
        heading: "Classification is structural, not semantic",
        body: "The analyser inspects each production's shape. A mixed or non-linear grammar might still happen to generate a regular language, but it is not a regular grammar by definition and cannot be converted by the direct algorithm.",
      },
    ],
    exercise: {
      question: "S → aS | Sb | λ should be classified as…",
      options: ["Right-linear", "Left-linear", "Mixed / not a regular grammar", "A regular expression"],
      answer: 2,
      explanation: "aS is right-only and Sb is left-only. Their mix violates the single-orientation requirement.",
    },
    sampleId: "mixed",
  },
  {
    id: "regular-languages",
    title: "Regular Languages",
    subtitle: "Grammars, automata, and expressions",
    minutes: 8,
    objectives: ["Recall the equivalence theorem", "Distinguish a grammar from its language", "Use closure properties"],
    sections: [
      {
        heading: "Equivalent descriptions",
        body: "A language L ⊆ T* is regular when it can be described by a regular expression, accepted by a DFA, accepted by an NFA (including λ-NFA), or generated by a regular grammar. These models describe exactly the same language class.",
        formula: "Regex ≡ DFA ≡ NFA/λ-NFA ≡ Regular grammar",
      },
      {
        heading: "Set notation is exact",
        body: "For an NFA M = (Q, T, δ, q₀, F), the accepted language can always be written exactly as a set comprehension using the extended transition function.",
        formula: "L(M) = { w ∈ T* | δ̂(q₀, w) ∩ F ≠ ∅ }",
      },
      {
        heading: "Limits",
        body: "Finite memory cannot count without bound. {aⁿbⁿ | n ≥ 0} is not regular; the pumping lemma proves it. A grammar such as S → aSb | λ is therefore not a regular grammar and its language is not regular.",
      },
    ],
    exercise: {
      question: "Which language is not regular?",
      options: ["a*", "Strings over {a,b} ending in b", "{aⁿbⁿ | n ≥ 0}", "Strings with an even number of a's"],
      answer: 2,
      explanation: "{aⁿbⁿ} requires unbounded counting between the a block and the b block; a finite automaton cannot store n.",
    },
    sampleId: "even-a",
  },
  {
    id: "grammar-to-nfa",
    title: "Regular Grammar → NFA",
    subtitle: "States mirror variables and transitions mirror productions",
    minutes: 9,
    objectives: ["Construct states and a dedicated final state", "Split terminal strings into chains", "Handle λ and alternatives"],
    sections: [
      {
        heading: "Construction",
        body: "For a right-linear grammar, create one state per variable plus a new final state F. For A → xB, add a path from A to B labelled by the symbols of x. For A → x, add a path from A to F labelled by x. For A → λ, add A --λ--> F.",
        formula: "A → xB  ⇒  A --x--> B        A → x  ⇒  A --x--> F",
      },
      {
        heading: "Intermediate states",
        body: "Automaton transitions consume one terminal at a time. If x = a₁a₂…aₖ, insert k − 1 intermediate states q₁…qₖ₋₁. Alternative productions with the same source create nondeterminism.",
      },
      {
        heading: "Why it works",
        body: "Each grammar rewrite emits a terminal prefix and leaves one variable. The corresponding automaton path consumes that prefix and arrives at the state for the remaining variable. The derivation terminates exactly when the automaton reaches F.",
      },
    ],
    derivation: ["S", "aA", "aaS", "aab", "F"],
    exercise: {
      question: "For S → aA and A → λ, which transitions are created?",
      options: [
        "S --a--> A and A --λ--> F",
        "S --λ--> A and A --a--> F",
        "S --a--> F only",
        "A --λ--> S and S --a--> F",
      ],
      answer: 0,
      explanation: "aA becomes a transition to A; the ε-production on A becomes a λ-transition to the dedicated final state F.",
    },
    sampleId: "classic",
  },
  {
    id: "nfa-to-grammar",
    title: "NFA → Regular Grammar",
    subtitle: "Transitions become right-linear productions",
    minutes: 7,
    objectives: ["Map states to variables", "Translate every transition", "Add λ for final states"],
    sections: [
      {
        heading: "Reverse construction",
        body: "Map each state q to a grammar variable Vq and use the initial state's variable as S. A transition q --a--> p becomes Vq → aVp. A λ-transition q --λ--> p becomes the unit production Vq → Vp.",
        formula: "q --a--> p  ⇒  Vq → aVp",
      },
      {
        heading: "Termination",
        body: "For every final state qf, add Vqf → λ. This allows the derivation to stop whenever the NFA is in an accepting state. If a final state also has outgoing transitions, the grammar has alternatives: stop or continue.",
        formula: "qf ∈ F  ⇒  Vqf → λ",
      },
      {
        heading: "Language equivalence",
        body: "A path from the initial state to a final state spells a word. The corresponding derivation emits the same symbols in the same order and then stops with λ. Hence L(G) = L(M).",
      },
    ],
    exercise: {
      question: "If q₀ --b--> q₁ and q₁ is final, which two productions are required?",
      options: [
        "Q0 → bQ1 and Q1 → λ",
        "Q1 → bQ0 and Q0 → λ",
        "Q0 → λ and Q1 → b",
        "Q0 → b and Q1 → Q0",
      ],
      answer: 0,
      explanation: "The transition gives Q0 → bQ1; final state q₁ gives Q1 → λ so the derivation can terminate after b.",
    },
    sampleId: "ends-b",
  },
];

export type QuizQuestion = {
  id: string;
  category: "Classification" | "Grammar → NFA" | "NFA → Grammar" | "Acceptance" | "Theory";
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    category: "Classification",
    prompt: "Classify G: S → aS | b.",
    options: ["Right-linear", "Left-linear", "Mixed", "Non-linear"],
    answer: 0,
    explanation: "aS has the variable at the right edge and b is terminal-only, so the grammar is right-linear.",
  },
  {
    id: "q2",
    category: "Classification",
    prompt: "Classify G: S → Sa | Sb | a | b.",
    options: ["Right-linear", "Left-linear", "Mixed", "Non-regular shape"],
    answer: 1,
    explanation: "Sa and Sb place the variable at the left edge; a and b are terminal-only. The grammar is left-linear.",
  },
  {
    id: "q3",
    category: "Classification",
    prompt: "Why is S → aS | Sb | λ not a regular grammar?",
    options: ["It uses λ", "It mixes right-only and left-only productions", "It has alternatives", "It has only one variable"],
    answer: 1,
    explanation: "aS is right-linear and Sb is left-linear. A regular grammar must choose one consistent orientation.",
  },
  {
    id: "q4",
    category: "Classification",
    prompt: "Which production has a variable in an interior position?",
    options: ["A → abB", "A → Bab", "A → aBb", "A → ab"],
    answer: 2,
    explanation: "A → aBb surrounds B with terminals; it is linear in the broad sense but neither right- nor left-linear.",
  },
  {
    id: "q5",
    category: "Grammar → NFA",
    prompt: "For S → aA and A → λ, what does the construction produce?",
    options: ["S --a--> A, A --λ--> F", "S --λ--> A, A --a--> F", "S --a--> F, no A state", "A --a--> S, S --λ--> F"],
    answer: 0,
    explanation: "Each A → xB becomes a path to B; A → λ becomes a λ-transition to the dedicated final state F.",
  },
  {
    id: "q6",
    category: "Grammar → NFA",
    prompt: "How many intermediate states are introduced by A → abcdB?",
    options: ["1", "2", "3", "4"],
    answer: 2,
    explanation: "A terminal string of length k needs k − 1 intermediate states so each transition reads exactly one symbol.",
  },
  {
    id: "q7",
    category: "Grammar → NFA",
    prompt: "Which feature of a right-linear grammar causes NFA nondeterminism?",
    options: ["Multiple variables", "Several alternatives from the same variable", "The final state F", "Uppercase state labels"],
    answer: 1,
    explanation: "Alternatives such as S → aS | b create more than one outgoing path from the state S.",
  },
  {
    id: "q8",
    category: "NFA → Grammar",
    prompt: "A transition q₀ --a--> q₁ is translated into…",
    options: ["Q0 → aQ1", "Q1 → aQ0", "Q0 → Q1a", "Q0 → a"],
    answer: 0,
    explanation: "The source state becomes the LHS, the terminal is emitted, and the destination variable is placed at the right edge.",
  },
  {
    id: "q9",
    category: "NFA → Grammar",
    prompt: "Why is Vf → λ added for a final state f?",
    options: ["To consume a symbol", "To let the derivation terminate at an accepting state", "To mark the start symbol", "To create nondeterminism"],
    answer: 1,
    explanation: "λ removes the last variable, ending the derivation exactly when the automaton can accept.",
  },
  {
    id: "q10",
    category: "Acceptance",
    prompt: "The grammar S → aS | λ generates a*. Which word is accepted?",
    options: ["aaa", "aab", "ba", "ab"],
    answer: 0,
    explanation: "S ⇒ aS ⇒ aaS ⇒ aaaS ⇒ aaa using S → λ at the last step. Any b causes rejection.",
  },
  {
    id: "q11",
    category: "Acceptance",
    prompt: "If q₀ --λ--> F, which statement about the empty word λ is true?",
    options: ["It is rejected", "It is accepted via λ-closure", "It needs one input symbol", "F must be the start state"],
    answer: 1,
    explanation: "The initial λ-closure includes F, so ε is accepted before any symbol is consumed.",
  },
  {
    id: "q12",
    category: "Theory",
    prompt: "Which statement is false?",
    options: [
      "Every regular grammar generates a regular language",
      "Every NFA has an equivalent DFA",
      "S → aSb | λ is a regular grammar",
      "λ-NFA does not increase the class of regular languages",
    ],
    answer: 2,
    explanation: "S → aSb | λ generates the non-regular language {aⁿbⁿ}; it is not right- or left-linear.",
  },
];
