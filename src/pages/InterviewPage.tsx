import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { ArrowRight, Brain, Check, GraduationCap, LoaderCircle, MessagesSquare, RotateCcw, Trophy, X } from 'lucide-react';
import { useAnswer, useDomains, useStartQuiz, type AnswerResult, type Difficulty, type Question } from '../api/interview';
import { EmptyState, ErrorState, Skeleton } from '../components/States';
import { useDocumentTitle } from '../lib/useDocumentTitle';

const LETTERS = ['A', 'B', 'C', 'D'];
const DIFFS: { value: Difficulty | ''; label: string }[] = [
  { value: '', label: 'Mixed' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

function Picker({ onStart, starting }: { onStart: (domain: string, d: Difficulty | '') => void; starting: boolean }) {
  const domains = useDomains();
  const [domain, setDomain] = useState('');
  const [diff, setDiff] = useState<Difficulty | ''>('');
  if (domains.isLoading) return <Skeleton className="h-80 w-full" />;
  if (domains.error) return <ErrorState message={String(domains.error)} onRetry={() => void domains.refetch()} />;
  const list = domains.data?.domains ?? [];
  if (!list.length) return <EmptyState title="Questions are on their way" hint="Check back soon." />;
  const total = list.reduce((a, d) => a + d.answered, 0);
  const right = list.reduce((a, d) => a + d.correct, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[{ domain: '', kind: 'technical' as const, questions: list.reduce((a, d) => a + d.questions, 0), answered: total, correct: right }, ...list].map((d, i) => {
          const on = domain === d.domain;
          const pct = d.questions ? Math.round((d.answered / d.questions) * 100) : 0;
          const Icon = !d.domain ? GraduationCap : d.kind === 'behavioral' ? MessagesSquare : Brain;
          return (
            <button
              key={d.domain || 'all'}
              onClick={() => setDomain(d.domain)}
              aria-pressed={on}
              style={{ animationDelay: `${i * 35}ms` }}
              className={clsx(
                'anim-rise rounded-card border bg-surface p-4 text-left transition-all duration-200 hover:-translate-y-px',
                on ? 'border-accent/50 ring-2 ring-accent/15' : 'border-border hover:border-accent/30',
              )}
            >
              <div className="flex items-center gap-2">
                <span className={clsx('rounded-lg p-1.5', on ? 'bg-accent/15 text-accent' : 'bg-surface-2 text-muted')}>
                  <Icon className="size-4" />
                </span>
                <span className="text-sm font-semibold text-text">{d.domain || 'Everything'}</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-accent transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] text-faint tabular-nums">
                <span>{d.answered}/{d.questions} answered</span>
                {d.answered > 0 && <span>{Math.round((d.correct / d.answered) * 100)}% right</span>}
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-surface p-4">
        <span className="text-sm text-muted">Difficulty</span>
        <div role="radiogroup" aria-label="Difficulty" className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5">
          {DIFFS.map((d) => (
            <button
              key={d.label}
              role="radio"
              aria-checked={diff === d.value}
              onClick={() => setDiff(d.value)}
              className={clsx(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200',
                diff === d.value ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text',
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => onStart(domain, diff)}
          disabled={starting}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent/85 disabled:opacity-60"
        >
          {starting ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowRight className="size-4" />} Start 10 questions
        </button>
      </div>
    </div>
  );
}

function Quiz({ questions, onDone }: { questions: Question[]; onDone: () => void }) {
  const answer = useAnswer();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [score, setScore] = useState(0);
  const finished = i >= questions.length;
  const q = questions[i];

  const choose = (c: number) => {
    if (picked !== null || !q) return;
    setPicked(c);
    answer.mutate(
      { id: q.id, choice: c },
      {
        onSuccess: (r) => {
          setResult(r);
          if (r.correct) setScore((s) => s + 1);
        },
      },
    );
  };
  const next = () => {
    setI((n) => n + 1);
    setPicked(null);
    setResult(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finished || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      const n = 'abcd'.indexOf(e.key.toLowerCase());
      if (n >= 0 && picked === null) choose(n);
      if ((e.key === 'Enter' || e.key === 'ArrowRight') && result) next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="modal-enter flex flex-col items-center gap-3 rounded-card border border-border bg-surface px-6 py-14 text-center">
        <span className="rounded-full bg-accent/10 p-4 text-accent">
          <Trophy className="size-7" />
        </span>
        <div className="font-mono text-4xl font-semibold tabular-nums text-text">
          {score}/{questions.length}
        </div>
        <p className="text-sm text-muted">
          {pct >= 80 ? 'Sharp. You are interview ready on these.' : pct >= 50 ? 'Solid. Review the misses and go again.' : 'Good practice. The explanations are where the learning is.'}
        </p>
        <button onClick={onDone} className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent/85">
          <RotateCcw className="size-4" /> Another round
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-xs text-muted">
        <button onClick={onDone} className="hover:text-text">← Topics</button>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${(i / questions.length) * 100}%` }} />
        </div>
        <span className="tabular-nums">{i + 1} / {questions.length}</span>
      </div>
      <div key={q.id} className="anim-rise rounded-card border border-border bg-surface p-6">
        <div className="mb-3 flex flex-wrap gap-1.5 text-[11px]">
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-muted">{q.domain}</span>
          <span
            className={clsx(
              'rounded-full px-2 py-0.5 font-medium capitalize',
              q.difficulty === 'easy' && 'bg-good/10 text-good',
              q.difficulty === 'medium' && 'bg-warn/10 text-warn',
              q.difficulty === 'hard' && 'bg-bad/10 text-bad',
            )}
          >
            {q.difficulty}
          </span>
        </div>
        <h2 className="text-lg leading-snug font-semibold text-text">{q.question}</h2>
        <div className="mt-5 grid gap-2">
          {q.choices.map((c, n) => {
            const isAnswer = result?.answer === n;
            const wrongPick = result && picked === n && !result.correct;
            return (
              <button
                key={n}
                onClick={() => choose(n)}
                disabled={picked !== null}
                className={clsx(
                  'flex items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-all duration-200',
                  !result && picked === null && 'border-border hover:border-accent/40 hover:bg-surface-2/60',
                  !result && picked === n && 'border-accent/50 bg-accent/5',
                  isAnswer && 'border-good/50 bg-good/10',
                  wrongPick && 'border-bad/50 bg-bad/10',
                  result && !isAnswer && !wrongPick && 'border-border opacity-60',
                )}
              >
                <span
                  className={clsx(
                    'flex size-6 shrink-0 items-center justify-center rounded-md font-mono text-xs font-semibold',
                    isAnswer ? 'bg-good text-white' : wrongPick ? 'bg-bad text-white' : 'bg-surface-2 text-muted',
                  )}
                >
                  {isAnswer ? <Check className="size-3.5" /> : wrongPick ? <X className="size-3.5" /> : LETTERS[n]}
                </span>
                <span className="pt-0.5 text-text">{c}</span>
              </button>
            );
          })}
        </div>
        {result && (
          <div className="fade-enter mt-5 rounded-lg border border-border bg-surface-2/50 p-4">
            <div className={clsx('text-sm font-semibold', result.correct ? 'text-good' : 'text-bad')}>
              {result.correct ? 'Correct' : `Not quite. The answer is ${LETTERS[result.answer]}.`}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-muted">{result.explanation}</p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-faint">Keys: A to D to answer, Enter for next</span>
        <button
          onClick={next}
          disabled={!result}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent/85 disabled:opacity-40"
        >
          {i + 1 === questions.length ? 'Finish' : 'Next'} <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

export default function InterviewPage() {
  useDocumentTitle('Interview prep');
  const start = useStartQuiz();
  const [quiz, setQuiz] = useState<Question[] | null>(null);
  return (
    <div className="mx-auto max-w-4xl pb-10">
      <header className="mb-6">
        <h1 className="text-[28px] leading-tight font-semibold">Interview prep</h1>
        <p className="mt-1 text-sm text-muted">Quick multiple-choice rounds to stay sharp on the go: CS fundamentals and behavioral questions.</p>
      </header>
      {quiz?.length ? (
        <div className="mx-auto max-w-2xl">
          <Quiz key={quiz[0].id} questions={quiz} onDone={() => setQuiz(null)} />
        </div>
      ) : (
        <>
          <Picker starting={start.isPending} onStart={(domain, difficulty) => start.mutate({ domain, difficulty }, { onSuccess: (r) => setQuiz(r.questions) })} />
          {quiz && !quiz.length && <p className="mt-3 text-sm text-muted">No questions match that topic and difficulty yet.</p>}
        </>
      )}
    </div>
  );
}
