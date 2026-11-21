import React, { useState } from 'react';
import { QUIZ_QUESTIONS } from '../../services/learningData';
import { QuizQuestion } from '../../types/grammar';
import confetti from 'canvas-confetti';
import { Award, CheckCircle2, XCircle, RotateCcw, Filter, ChevronRight, Sparkles } from 'lucide-react';

export const PracticeQuizView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [showExplanations, setShowExplanations] = useState<Record<string, boolean>>({});
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  const filteredQuestions: QuizQuestion[] = React.useMemo(() => {
    if (selectedCategory === 'all') return QUIZ_QUESTIONS;
    return QUIZ_QUESTIONS.filter(q => q.category === selectedCategory);
  }, [selectedCategory]);

  const currentQuestion = filteredQuestions[activeQuestionIndex] || filteredQuestions[0];

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (showExplanations[questionId]) return; // locked after answering

    setUserAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    setShowExplanations(prev => ({ ...prev, [questionId]: true }));

    // Check if correct
    if (optionIndex === currentQuestion.correctIndex) {
      // mini confetti for correct answer
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.8 }
      });
    }
  };

  const calculateScore = () => {
    let score = 0;
    filteredQuestions.forEach(q => {
      if (userAnswers[q.id] === q.correctIndex) score++;
    });
    return score;
  };

  const answeredCount = Object.keys(userAnswers).filter(id =>
    filteredQuestions.some(q => q.id === id)
  ).length;

  const handleFinishQuiz = () => {
    setQuizFinished(true);
    const score = calculateScore();
    if (score / filteredQuestions.length >= 0.7) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const handleResetQuiz = () => {
    setUserAnswers({});
    setShowExplanations({});
    setActiveQuestionIndex(0);
    setQuizFinished(false);
  };

  return (
    <div className="space-y-6">
      {/* Quiz Header & Category Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-bold text-white">Interactive Assessment & Quiz Center</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              12 University-level questions testing grammar classification, automata conversion, and formal language theory
            </p>
          </div>

          {/* Score Counter */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">Score: </span>
              <span className="text-purple-400 font-bold">{calculateScore()}</span>
              <span className="text-slate-500"> / {filteredQuestions.length}</span>
            </div>
            <button
              onClick={handleResetQuiz}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
              title="Reset Quiz"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Topic:
          </span>
          {[
            { id: 'all', label: 'All Topics' },
            { id: 'classification', label: 'Grammar Classification' },
            { id: 'conversion', label: 'Grammar to NFA' },
            { id: 'nfa-to-grammar', label: 'NFA to Grammar' },
            { id: 'acceptance', label: 'String Acceptance' },
            { id: 'theory', label: 'Chomsky & Theory' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setActiveQuestionIndex(0);
              }}
              className={`px-2.5 py-1 rounded-md text-xs transition ${
                selectedCategory === cat.id
                  ? 'bg-purple-600 text-white font-medium shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Question Card or Final Score Card */}
      {!quizFinished ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
          {/* Question Counter & Meta */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="bg-purple-950 text-purple-300 font-mono font-bold px-2 py-0.5 rounded border border-purple-800">
                Question {activeQuestionIndex + 1} of {filteredQuestions.length}
              </span>
              <span className="text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                Category: {currentQuestion.category.replace('-', ' ')}
              </span>
            </div>
            <div className="text-slate-400">
              Answered: {answeredCount}/{filteredQuestions.length}
            </div>
          </div>

          {/* Question Title & Prompt */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-white">{currentQuestion.title}</h3>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-purple-200 whitespace-pre-line leading-relaxed shadow-inner">
              {currentQuestion.prompt}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {currentQuestion.options.map((opt, optIdx) => {
              const isSelected = userAnswers[currentQuestion.id] === optIdx;
              const hasAnswered = showExplanations[currentQuestion.id];
              const isCorrect = optIdx === currentQuestion.correctIndex;

              let btnStyle = 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700';

              if (hasAnswered) {
                if (isCorrect) {
                  btnStyle = 'bg-emerald-950/70 border-emerald-600 text-emerald-200 font-semibold ring-1 ring-emerald-500';
                } else if (isSelected && !isCorrect) {
                  btnStyle = 'bg-red-950/70 border-red-600 text-red-200 ring-1 ring-red-500';
                } else {
                  btnStyle = 'bg-slate-950/50 border-slate-800/60 text-slate-500 opacity-60';
                }
              }

              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                  disabled={hasAnswered}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition flex items-center justify-between ${btnStyle}`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center font-mono text-[10px] text-slate-400">
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span>{opt}</span>
                  </span>

                  {hasAnswered && isCorrect && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                  )}
                  {hasAnswered && isSelected && !isCorrect && (
                    <XCircle className="w-4 h-4 text-red-400 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Instant Feedback & Mathematical Explanation */}
          {showExplanations[currentQuestion.id] && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div
                className={`font-bold flex items-center gap-1.5 ${
                  userAnswers[currentQuestion.id] === currentQuestion.correctIndex
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}
              >
                {userAnswers[currentQuestion.id] === currentQuestion.correctIndex ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Correct Answer!
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" /> Incorrect Choice
                  </>
                )}
              </div>
              <p className="text-slate-300 leading-relaxed">{currentQuestion.explanation}</p>
            </div>
          )}

          {/* Quiz Stepper Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              disabled={activeQuestionIndex === 0}
              onClick={() => setActiveQuestionIndex(i => Math.max(0, i - 1))}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg text-xs text-slate-300"
            >
              Previous
            </button>

            {activeQuestionIndex < filteredQuestions.length - 1 ? (
              <button
                onClick={() => setActiveQuestionIndex(i => Math.min(filteredQuestions.length - 1, i + 1))}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs text-white font-medium flex items-center gap-1.5"
              >
                Next Question <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinishQuiz}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs text-white font-bold flex items-center gap-1.5 shadow-md"
              >
                <Sparkles className="w-4 h-4" /> Finish & View Results
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Final Score Banner */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-5">
          <div className="w-16 h-16 bg-purple-950/80 border border-purple-800/80 rounded-2xl flex items-center justify-center mx-auto text-purple-400 shadow-lg">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Assessment Complete!</h3>
            <p className="text-xs text-slate-400">
              You scored <span className="text-purple-300 font-bold text-base">{calculateScore()}</span> out of{' '}
              <span className="font-bold">{filteredQuestions.length}</span> (
              {Math.round((calculateScore() / filteredQuestions.length) * 100)}%)
            </p>
          </div>

          <div className="max-w-xs mx-auto pt-2">
            <button
              onClick={handleResetQuiz}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <RotateCcw className="w-4 h-4" /> Retake Assessment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
