import { useMemo, useState } from "react";
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  CircleHelp,
  RotateCcw,
  Trophy,
  XCircle,
} from "lucide-react";
import { QUIZ_QUESTIONS } from "../lib/data";
import type { QuizQuestion } from "../lib/data";
import { Badge, Card, EmptyState, PageHeader } from "./ui";
import type { AppContext } from "./viewTypes";

type AnswerRecord = {
  question: QuizQuestion;
  selected: number;
  correct: boolean;
};

export default function QuizView({ ctx }: { ctx: AppContext }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [finished, setFinished] = useState(false);
  const question = QUIZ_QUESTIONS[index];
  const score = answers.filter((answer) => answer.correct).length;
  const percent = Math.round((score / QUIZ_QUESTIONS.length) * 100);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; correct: number }>();
    for (const answer of answers) {
      const item = map.get(answer.question.category) ?? { total: 0, correct: 0 };
      item.total += 1;
      if (answer.correct) item.correct += 1;
      map.set(answer.question.category, item);
    }
    return Array.from(map.entries());
  }, [answers]);

  const check = () => {
    if (selected === null || checked) return;
    const correct = selected === question.answer;
    setAnswers((current) => [...current, { question, selected, correct }]);
    setChecked(true);
  };

  const next = () => {
    if (index === QUIZ_QUESTIONS.length - 1) {
      const finalScore = answers.filter((answer) => answer.correct).length;
      if (finalScore > ctx.quizBest) ctx.setQuizBest(finalScore);
      setFinished(true);
    } else {
      setIndex((current) => current + 1);
      setSelected(null);
      setChecked(false);
    }
  };

  const restart = () => {
    setIndex(0);
    setSelected(null);
    setChecked(false);
    setAnswers([]);
    setFinished(false);
  };

  return (
    <div className="fade-in">
      <PageHeader
        eyebrow="Module 10 · Assessment"
        title="Practice & Quiz"
        description="Twelve questions cover classification, grammar-to-NFA construction, reverse conversion, language theory, and string acceptance. Each answer includes an explanation."
        actions={
          <>
            <Badge tone="purple" icon={Trophy}>Best: {ctx.quizBest}/{QUIZ_QUESTIONS.length}</Badge>
            <button className="btn btn-secondary" onClick={() => ctx.navigate("learning")}><BookOpen /> Review lessons</button>
          </>
        }
      />

      {finished ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-8">
            <Card title="Quiz complete" subtitle="Your answers and explanations are preserved below for review.">
              <div className="flex flex-col sm:flex-row items-center gap-5">
                <div
                  className="w-28 h-28 rounded-full grid place-items-center flex-none"
                  style={{ background: `conic-gradient(var(--accent) ${percent * 3.6}deg, var(--surface-muted) 0deg)` }}
                >
                  <div className="w-[88px] h-[88px] rounded-full grid place-items-center" style={{ background: "var(--surface)" }}>
                    <div className="text-center"><div className="text-2xl font-bold">{percent}%</div><div className="text-[10px]" style={{ color: "var(--muted)" }}>score</div></div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-xl font-bold">{score} / {QUIZ_QUESTIONS.length} correct</div>
                  <p className="text-[12.5px] mt-1 leading-relaxed" style={{ color: "var(--muted)" }}>
                    {percent >= 85 ? "Excellent mastery of regular grammars and automata constructions." : percent >= 60 ? "Solid foundation. Review the explanations below and revisit the linked lessons." : "Work through the Learning Center lessons, then retry the quiz."}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button className="btn btn-primary btn-small" onClick={restart}><RotateCcw /> Restart quiz</button>
                    <button className="btn btn-secondary btn-small" onClick={() => ctx.navigate("learning")}><BookOpen /> Learning Center</button>
                    <button className="btn btn-secondary btn-small" onClick={() => ctx.navigate("builder")}>Open lab <ArrowRight /></button>
                  </div>
                </div>
              </div>
              <div className="divider my-5" />
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {answers.map((answer, position) => (
                  <div className={`notice ${answer.correct ? "notice-success" : "notice-danger"}`} key={answer.question.id}>
                    {answer.correct ? <CheckCircle2 /> : <XCircle />}
                    <span>
                      <strong>Q{position + 1}: {answer.question.prompt}</strong><br />
                      Your answer: {answer.question.options[answer.selected]} · Correct: {answer.question.options[answer.question.answer]}<br />
                      <span style={{ color: "var(--muted)" }}>{answer.question.explanation}</span>
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <div className="xl:col-span-4 space-y-5">
            <Card title="Category breakdown" subtitle="Scores from this attempt.">
              <div className="space-y-3">
                {categoryBreakdown.map(([category, item]) => (
                  <div key={category}>
                    <div className="flex justify-between text-[12px] mb-1"><span>{category}</span><strong>{item.correct}/{item.total}</strong></div>
                    <div className="progress-track"><div className="progress-fill" style={{ width: `${(item.correct / item.total) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Achievement" subtitle="Best score is stored locally in this browser.">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl grid place-items-center" style={{ background: "var(--warning-soft)", color: "var(--warning)" }}><Award size={24} /></div>
                <div><div className="text-xl font-bold">{Math.max(ctx.quizBest, score)}/{QUIZ_QUESTIONS.length}</div><div className="text-[11px]" style={{ color: "var(--muted)" }}>Best recorded result</div></div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-8">
            <Card
              title={`Question ${index + 1} of ${QUIZ_QUESTIONS.length}`}
              subtitle="Select an answer and check it to reveal the explanation."
              action={<Badge tone="blue" icon={CircleHelp}>{question.category}</Badge>}
            >
              <div className="progress-track mb-4"><div className="progress-fill" style={{ width: `${((index + (checked ? 1 : 0)) / QUIZ_QUESTIONS.length) * 100}%` }} /></div>
              <p className="text-[15px] font-semibold leading-relaxed mb-4">{question.prompt}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {question.options.map((option, optionIndex) => {
                  const isSelected = selected === optionIndex;
                  const showCorrect = checked && optionIndex === question.answer;
                  const showWrong = checked && isSelected && optionIndex !== question.answer;
                  return (
                    <button
                      type="button"
                      key={option}
                      disabled={checked}
                      className={`selection-card quiz-option ${isSelected ? "selected" : ""} ${showCorrect ? "correct" : ""} ${showWrong ? "wrong" : ""}`}
                      onClick={() => setSelected(optionIndex)}
                    >
                      <span className="text-[13px] flex gap-2">
                        <span className="math font-bold" style={{ color: "var(--accent)" }}>{String.fromCharCode(65 + optionIndex)}.</span>
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2 mt-5">
                {!checked ? (
                  <button className="btn btn-primary" disabled={selected === null} onClick={check}><CheckCircle2 /> Check answer</button>
                ) : (
                  <button className="btn btn-primary" onClick={next}>{index === QUIZ_QUESTIONS.length - 1 ? "Finish quiz" : "Next question"} <ArrowRight /></button>
                )}
                <button className="btn btn-secondary" onClick={restart}><RotateCcw /> Restart</button>
              </div>
              {checked ? (
                <div className={`notice mt-4 ${selected === question.answer ? "notice-success" : "notice-danger"}`}>
                  {selected === question.answer ? <CheckCircle2 /> : <XCircle />}
                  <span><strong>{selected === question.answer ? "Correct." : "Incorrect."}</strong> {question.explanation}</span>
                </div>
              ) : null}
            </Card>
          </div>
          <div className="xl:col-span-4 space-y-5">
            <Card title="Live score" subtitle="Current attempt.">
              <div className="grid grid-cols-2 gap-2">
                <div className="pill-box"><div className="text-[10px]" style={{ color: "var(--muted)" }}>Correct</div><div className="text-2xl font-bold" style={{ color: "var(--success)" }}>{score}</div></div>
                <div className="pill-box"><div className="text-[10px]" style={{ color: "var(--muted)" }}>Answered</div><div className="text-2xl font-bold">{answers.length}</div></div>
              </div>
              <div className="mt-4"><Badge tone="purple" icon={Trophy}>Best: {ctx.quizBest}/{QUIZ_QUESTIONS.length}</Badge></div>
            </Card>
            <Card title="Question navigator" subtitle="Answered questions are marked.">
              <div className="grid grid-cols-6 gap-1.5">
                {QUIZ_QUESTIONS.map((item, position) => (
                  <div
                    key={item.id}
                    className="h-8 rounded-lg grid place-items-center text-[11px] font-bold"
                    style={{
                      background: position === index ? "var(--accent-soft)" : answers[position] ? "var(--surface-muted)" : "var(--surface-soft)",
                      color: position === index ? "var(--accent)" : "var(--muted)",
                      border: "1px solid var(--border)",
                    }}
                    title={answers[position] ? (answers[position].correct ? "Correct" : "Incorrect") : "Not answered"}
                  >
                    {position + 1}
                  </div>
                ))}
              </div>
              <p className="text-[11px] mt-3" style={{ color: "var(--muted)" }}>Questions are presented in curriculum order so each concept builds on the previous one.</p>
            </Card>
            <Card title="Need a refresher?">
              <EmptyState icon={BookOpen} title="Seven guided lessons" message="Review linear grammars, regular languages, and both conversion directions before retrying." action={<button className="btn btn-secondary btn-small" onClick={() => ctx.navigate("learning")}>Open Learning Center</button>} />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
