import type { Analysis, ConversionResult, Grammar, Nfa, SectionId } from "../lib/types";

export type NavigateFn = (section: SectionId) => void;

export type AppContext = {
  grammar: Grammar;
  updateGrammar: (grammar: Grammar) => void;
  analysis: Analysis;
  conversion: ConversionResult;
  activeNfa: Nfa;
  activeNfaLabel: string;
  setActiveNfa: (nfa: Nfa, label: string) => void;
  navigate: NavigateFn;
  loadSample: (sampleId: string) => void;
  sampleId: string;
  completedLessons: string[];
  toggleLesson: (lessonId: string) => void;
  quizBest: number;
  setQuizBest: (score: number) => void;
  visited: SectionId[];
  simulatorInput: string;
  setSimulatorInput: (input: string) => void;
};
