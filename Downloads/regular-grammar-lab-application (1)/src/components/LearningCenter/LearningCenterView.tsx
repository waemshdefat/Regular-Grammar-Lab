import React, { useState } from 'react';
import { LESSONS, Lesson } from '../../services/learningData';
import { BookOpen, CheckCircle, ChevronRight, ChevronLeft, Lightbulb, Clock } from 'lucide-react';

interface LearningCenterViewProps {
  onSelectLesson?: (lessonId: string) => void;
}

export const LearningCenterView: React.FC<LearningCenterViewProps> = () => {
  const [selectedLessonIndex, setSelectedLessonIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [completedLessons, setCompletedLessons] = useState<Record<number, boolean>>({});

  const lesson: Lesson = LESSONS[selectedLessonIndex];

  const handleLessonChange = (newIndex: number) => {
    setSelectedLessonIndex(newIndex);
    setSelectedAnswer(null);
    setShowFeedback(false);
  };

  const handleCheckAnswer = () => {
    setShowFeedback(true);
    if (selectedAnswer === lesson.quickCheck.correctIndex) {
      setCompletedLessons(prev => ({ ...prev, [lesson.number]: true }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Learning Center Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-bold text-white">Interactive Theory & Learning Center</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              University curriculum modules covering Linear Grammars, Chomsky Type-3, and Automata Equivalence
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Progress:</span>
            <div className="w-24 bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
              <div
                className="bg-purple-600 h-full transition-all duration-300"
                style={{
                  width: `${(Object.keys(completedLessons).length / LESSONS.length) * 100}%`
                }}
              />
            </div>
            <span className="font-mono text-purple-300 font-bold">
              {Object.keys(completedLessons).length}/{LESSONS.length}
            </span>
          </div>
        </div>

        {/* Lesson Navigation Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-4">
          {LESSONS.map((l, idx) => {
            const isCurrent = idx === selectedLessonIndex;
            const isDone = completedLessons[l.number];
            return (
              <button
                key={l.id}
                onClick={() => handleLessonChange(idx)}
                className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-purple-950/70 border-purple-500 text-white shadow-sm ring-1 ring-purple-500/50'
                    : isDone
                    ? 'bg-slate-950 border-emerald-900/60 text-slate-300 hover:bg-slate-800'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className={isCurrent ? 'text-purple-300 font-bold' : 'text-slate-400'}>
                    L{l.number}
                  </span>
                  {isDone && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div className="text-xs font-semibold mt-1 truncate">{l.title}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Lesson Content Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
        {/* Lesson Meta Header */}
        <div className="space-y-2 pb-4 border-b border-slate-800">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="bg-purple-950 text-purple-300 font-mono font-bold px-2 py-0.5 rounded border border-purple-800">
              Module {lesson.number} of {LESSONS.length}
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5" /> {lesson.readingTime}
            </span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">{lesson.title}</h3>
          <p className="text-sm text-purple-300/90 font-medium">{lesson.tagline}</p>
          <p className="text-xs text-slate-400 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
            {lesson.summary}
          </p>
        </div>

        {/* Lesson Subsections */}
        <div className="space-y-6">
          {lesson.content.map((sec, idx) => (
            <div key={idx} className="space-y-3">
              <h4 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-indigo-500 rounded-full inline-block"></span>
                {sec.heading}
              </h4>

              <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                {sec.paragraphs.map((p, pIdx) => (
                  <p key={pIdx}>{p}</p>
                ))}
              </div>

              {/* Math Box */}
              {sec.mathBox && (
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-mono text-xs text-purple-200 text-center shadow-inner overflow-x-auto whitespace-pre-wrap">
                  {sec.mathBox}
                </div>
              )}

              {/* Examples */}
              {sec.examples && (
                <div className="space-y-2">
                  {sec.examples.map((ex, exIdx) => (
                    <div
                      key={exIdx}
                      className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-xs space-y-1.5"
                    >
                      <div className="font-semibold text-white">{ex.title}</div>
                      <div className="font-mono text-purple-300 space-y-0.5 pl-2 border-l-2 border-purple-600">
                        {ex.rules.map((r, rIdx) => (
                          <div key={rIdx}>{r}</div>
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-400 font-sans italic">{ex.note}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Key Takeaway */}
              <div className="bg-purple-950/20 border border-purple-800/40 p-3 rounded-lg flex items-start gap-2.5 text-xs text-purple-200">
                <Lightbulb className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-purple-300">Key Principle: </strong>
                  {sec.keyTakeaway}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Check Mini-Quiz */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4 pt-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-indigo-400" />
              Checkpoint: Test Your Understanding
            </h4>
            <span className="text-[11px] text-slate-400">1 question</span>
          </div>

          <p className="text-xs text-slate-200 font-medium">{lesson.quickCheck.question}</p>

          <div className="space-y-2">
            {lesson.quickCheck.options.map((opt, optIdx) => {
              const isSelected = selectedAnswer === optIdx;
              const isCorrect = optIdx === lesson.quickCheck.correctIndex;
              let btnClass = 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850';

              if (showFeedback) {
                if (isCorrect) {
                  btnClass = 'bg-emerald-950 border-emerald-600 text-emerald-200 font-semibold';
                } else if (isSelected && !isCorrect) {
                  btnClass = 'bg-red-950 border-red-600 text-red-200';
                }
              } else if (isSelected) {
                btnClass = 'bg-purple-950 border-purple-500 text-purple-200';
              }

              return (
                <button
                  key={optIdx}
                  onClick={() => {
                    if (!showFeedback) setSelectedAnswer(optIdx);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition flex items-center justify-between ${btnClass}`}
                >
                  <span>{opt}</span>
                  {showFeedback && isCorrect && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            {!showFeedback ? (
              <button
                disabled={selectedAnswer === null}
                onClick={handleCheckAnswer}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition"
              >
                Submit Answer
              </button>
            ) : (
              <div className="text-xs space-y-1">
                <div
                  className={`font-bold ${
                    selectedAnswer === lesson.quickCheck.correctIndex
                      ? 'text-emerald-400'
                      : 'text-red-400'
                  }`}
                >
                  {selectedAnswer === lesson.quickCheck.correctIndex
                    ? '✓ Correct!'
                    : '✗ Incorrect.'}
                </div>
                <p className="text-slate-400 text-[11px]">{lesson.quickCheck.explanation}</p>
              </div>
            )}
          </div>
        </div>

        {/* Previous / Next Lesson Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            disabled={selectedLessonIndex === 0}
            onClick={() => handleLessonChange(selectedLessonIndex - 1)}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg text-xs text-slate-300 flex items-center gap-1.5 transition"
          >
            <ChevronLeft className="w-4 h-4" /> Previous Lesson
          </button>

          {selectedLessonIndex < LESSONS.length - 1 ? (
            <button
              onClick={() => handleLessonChange(selectedLessonIndex + 1)}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs text-white font-medium flex items-center gap-1.5 transition"
            >
              Next Lesson <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              Curriculum Complete! <CheckCircle className="w-4 h-4" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
