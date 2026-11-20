import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  FlaskConical,
  GraduationCap,
  Lightbulb,
  Target,
  XCircle,
} from "lucide-react";
import { LESSONS } from "../lib/data";
import { LAMBDA, type SectionId } from "../lib/types";
import { Badge, Card, Formula, PageHeader, RuleText, TokenizedExpression } from "./ui";
import type { AppContext } from "./viewTypes";

const LAB_SECTIONS: Record<string, SectionId> = {
  linear: "classification",
  "right-linear": "builder",
  "left-linear": "classification",
  "regular-grammar": "classification",
  "regular-languages": "language",
  "grammar-to-nfa": "conversion",
  "nfa-to-grammar": "reverse",
};

export default function LearningView({ ctx }: { ctx: AppContext }) {
  const [lessonId, setLessonId] = useState(LESSONS[0].id);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [diagramIndex, setDiagramIndex] = useState(0);

  const lessonIndex = Math.max(0, LESSONS.findIndex((item) => item.id === lessonId));
  const lesson = LESSONS[lessonIndex];
  const completed = ctx.completedLessons.includes(lesson.id);
  const progressPercent = Math.round((ctx.completedLessons.length / LESSONS.length) * 100);

  useEffect(() => {
    setSelectedAnswer(null);
    setChecked(false);
    setDiagramIndex(0);
  }, [lessonId]);

  const diagramNodes = useMemo(() => {
    if (lesson.derivation?.length) return lesson.derivation;
    if (lesson.id === "grammar-to-nfa") return ["A", "x₁", "q₁", "x₂", "B / F"];
    if (lesson.id === "nfa-to-grammar") return ["q₀", "a", "q₁", LAMBDA, "accept"];
    return ["A", "x", "B", "terminal word"];
  }, [lesson]);

  const correct = selectedAnswer === lesson.exercise.answer;

  const checkAnswer = () => {
    if (selectedAnswer === null) return;
    setChecked(true);
    if (selectedAnswer === lesson.exercise.answer && !ctx.completedLessons.includes(lesson.id)) {
      ctx.toggleLesson(lesson.id);
    }
  };

  const openExample = () => {
    if (lesson.sampleId) ctx.loadSample(lesson.sampleId);
    ctx.navigate(LAB_SECTIONS[lesson.id] ?? "builder");
  };

  return (
    <div className="fade-in">
      <PageHeader
        eyebrow="Module 09 · Guided theory"
        title="Learning Center"
        description="Seven structured lessons connect formal definitions to the algorithms implemented in this lab. Each lesson includes notation, examples, an interactive derivation diagram, and an instant-feedback exercise."
        actions={
          <>
            <Badge tone="purple" icon={GraduationCap}>{ctx.completedLessons.length}/{LESSONS.length} complete</Badge>
            <button className="btn btn-primary" onClick={() => ctx.navigate("quiz")}>Take the quiz <ArrowRight /></button>
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-3">
          <Card title="Lesson roadmap" subtitle="Progress is saved in this browser." padded>
            <div className="progress-track mb-2"><div className="progress-fill" style={{ width: `${progressPercent}%` }} /></div>
            <div className="text-[11px] mb-4" style={{ color: "var(--muted)" }}>{progressPercent}% complete · click any lesson</div>
            <div className="space-y-1.5">
              {LESSONS.map((item, index) => {
                const isComplete = ctx.completedLessons.includes(item.id);
                return (
                  <button
                    type="button"
                    key={item.id}
                    className={`selection-card !p-2.5 ${item.id === lessonId ? "selected" : ""}`}
                    onClick={() => setLessonId(item.id)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg grid place-items-center flex-none text-[11px] font-bold ${isComplete ? "" : ""}`} style={{ background: isComplete ? "var(--success-soft)" : "var(--surface-muted)", color: isComplete ? "var(--success)" : "var(--muted)" }}>
                        {isComplete ? <CheckCircle2 size={15} /> : index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] font-semibold truncate">{item.title}</div>
                        <div className="text-[10px]" style={{ color: "var(--muted)" }}>{item.minutes} min · {item.subtitle}</div>
                      </div>
                      <ChevronRight size={14} style={{ color: "var(--faint)" }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="xl:col-span-9 space-y-5">
          <Card
            title={`Lesson ${lessonIndex + 1}: ${lesson.title}`}
            subtitle={lesson.subtitle}
            action={
              <div className="flex flex-wrap gap-2">
                <Badge icon={Clock3}>{lesson.minutes} min</Badge>
                {completed ? <Badge tone="success" icon={CheckCircle2}>Completed</Badge> : <Badge tone="blue">In progress</Badge>}
              </div>
            }
          >
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <button className="btn btn-primary btn-small" onClick={openExample}><FlaskConical /> Open related example</button>
              <button className="btn btn-secondary btn-small" onClick={() => ctx.navigate(LAB_SECTIONS[lesson.id] ?? "builder")}>Practice in lab <ArrowRight /></button>
              <button className="btn btn-ghost btn-small" onClick={() => ctx.toggleLesson(lesson.id)}>{completed ? "Mark unfinished" : "Mark complete"}</button>
              {lessonIndex < LESSONS.length - 1 ? (
                <button className="btn btn-ghost btn-small" onClick={() => setLessonId(LESSONS[lessonIndex + 1].id)}>Next lesson <ChevronRight /></button>
              ) : null}
            </div>

            <div className="p-3 rounded-xl mb-4" style={{ background: "var(--surface-soft)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--accent)" }}><Target size={14} /> Learning objectives</div>
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11.5px]" style={{ color: "var(--muted)" }}>
                {lesson.objectives.map((objective) => <li key={objective} className="flex gap-2"><span className="dot" style={{ background: "var(--accent)", marginTop: 6 }} />{objective}</li>)}
              </ul>
            </div>

            <div className="space-y-4">
              {lesson.sections.map((section) => (
                <div key={section.heading}>
                  <h3 className="text-[14px] font-bold mb-1.5">{section.heading}</h3>
                  <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--muted)" }}>{section.body}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {section.formula ? <Formula>{section.formula}</Formula> : null}
                    {section.example ? <div className="code-box code-box-dark !py-2 !px-3 text-[12px]">{section.example}</div> : null}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Interactive derivation diagram" subtitle="Click a stage to inspect it. The chain shows how a sentential form changes under successive productions.">
            <div className="flex flex-wrap items-center gap-2">
              {diagramNodes.map((node, index) => (
                <span key={`${node}-${index}`} className="flex items-center gap-2">
                  {index > 0 ? <ArrowRight size={15} style={{ color: "var(--faint)" }} /> : null}
                  <button
                    type="button"
                    className={`pill-box math text-[13px] ${diagramIndex === index ? "active" : ""}`}
                    onClick={() => setDiagramIndex(index)}
                  >
                    <TokenizedExpression value={node} />
                  </button>
                </span>
              ))}
            </div>
            <div className="notice notice-info mt-4">
              <Lightbulb />
              <span>
                <strong>Stage {diagramIndex + 1}:</strong> {diagramIndex === 0
                  ? "The derivation begins with a variable, usually the start symbol S."
                  : diagramIndex === diagramNodes.length - 1
                    ? "The final sentential form contains no variables, so it is a word in T*. In an NFA, this corresponds to reaching a final state."
                    : `After ${diagramIndex} production application(s), the sentential form is “${diagramNodes[diagramIndex]}”. Variables are replaced; emitted terminals remain in place.`}
              </span>
            </div>
            {lesson.sampleId ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <RuleText rule="A → xB" className="!text-[12px]" />
                <RuleText rule="A → Bx" className="!text-[12px]" />
                <RuleText rule={`A → ${LAMBDA}`} className="!text-[12px]" />
              </div>
            ) : null}
          </Card>

          <Card
            title="Practice exercise"
            subtitle="Choose one answer, then check it for an immediate explanation."
            action={<Badge tone="purple" icon={CircleHelp}>Single choice</Badge>}
          >
            <p className="text-[13px] font-semibold mb-3">{lesson.exercise.question}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {lesson.exercise.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const showCorrect = checked && index === lesson.exercise.answer;
                const showWrong = checked && isSelected && !correct;
                return (
                  <button
                    type="button"
                    key={option}
                    disabled={checked}
                    className={`selection-card quiz-option ${isSelected ? "selected" : ""} ${showCorrect ? "correct" : ""} ${showWrong ? "wrong" : ""}`}
                    onClick={() => setSelectedAnswer(index)}
                  >
                    <span className="text-[12.5px] flex gap-2"><span className="math font-bold" style={{ color: "var(--accent)" }}>{String.fromCharCode(65 + index)}.</span>{option}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <button className="btn btn-primary btn-small" disabled={selectedAnswer === null || checked} onClick={checkAnswer}><CheckCircle2 /> Check answer</button>
              <button className="btn btn-secondary btn-small" onClick={() => { setSelectedAnswer(null); setChecked(false); }}>Try again</button>
            </div>
            {checked ? (
              <div className={`notice mt-4 ${correct ? "notice-success" : "notice-danger"}`}>
                {correct ? <CheckCircle2 /> : <XCircle />}
                <span><strong>{correct ? "Correct." : "Not quite."}</strong> {lesson.exercise.explanation}</span>
              </div>
            ) : null}
            {correct && checked ? (
              <button className="btn btn-secondary w-full mt-3" onClick={() => lessonIndex < LESSONS.length - 1 && setLessonId(LESSONS[lessonIndex + 1].id)}>
                <BookOpen /> Continue to next lesson <ArrowRight />
              </button>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  );
}
