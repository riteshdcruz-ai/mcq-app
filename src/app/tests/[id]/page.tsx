"use client";
import { useEffect, useState, useCallback, useRef, use } from "react";
import { useRouter } from "next/navigation";

type Option = "A" | "B" | "C" | "D";
type Question = {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  isMultiSelect: boolean;
};

export default function TakeTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [testTitle, setTestTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [warnings, setWarnings] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const warningsRef = useRef(0);
  const submitRef = useRef<() => void>(() => {});

  const submit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    await fetch(`/api/tests/${id}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submit" }),
    });
    router.push(`/tests/${id}/result`);
  }, [id, router, submitting]);

  useEffect(() => {
    async function init() {
      // 1. Get test info (title, timeLimit)
      const testRes = await fetch(`/api/tests/${id}`);
      const testData = await testRes.json();
      setTestTitle(testData.title);

      // 2. Start (or resume) the attempt — this creates random questions if needed
      const startRes = await fetch(`/api/tests/${id}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      if (!startRes.ok) {
        router.push("/dashboard");
        return;
      }

      // 3. Fetch attempt with full question details
      const attemptRes = await fetch(`/api/tests/${id}/attempt`);
      const attemptData = await attemptRes.json();

      if (!attemptData) {
        router.push("/dashboard");
        return;
      }

      // Calculate remaining time based on when the attempt actually started
      const elapsed = Math.floor((Date.now() - new Date(attemptData.startedAt).getTime()) / 1000);
      const remaining = Math.max(1, testData.timeLimit * 60 - elapsed);
      setTimeLeft(remaining);

      // Build question list from attempt answers (works for both random and fixed tests)
      const qs: Question[] = attemptData.answers.map(
        (a: { question: Question; selectedOption: string | null }) => a.question
      );
      const savedAnswers: Record<string, string | null> = {};
      attemptData.answers.forEach(
        (a: { question: Question; selectedOption: string | null }) => {
          savedAnswers[a.question.id] = a.selectedOption ?? null;
        }
      );

      setQuestions(qs);
      setAnswers(savedAnswers);
      setLoading(false);
    }
    init();
  }, [id]);

  // Keep submitRef current so the visibility handler never captures a stale closure
  useEffect(() => { submitRef.current = submit; }, [submit]);

  // Warn on tab switch / window hide; auto-submit after 3 violations
  useEffect(() => {
    if (loading) return;
    const handleVisibility = () => {
      if (document.visibilityState !== "hidden") return;
      const next = warningsRef.current + 1;
      warningsRef.current = next;
      setWarnings(next);
      setShowWarning(true);
      if (next >= 3) submitRef.current();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [loading]);

  useEffect(() => {
    if (!timeLeft || loading) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(t); submit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [timeLeft, loading, submit]);

  async function selectOption(questionId: string, option: Option, isMultiSelect: boolean) {
    let next: string | null;
    if (isMultiSelect) {
      const current = answers[questionId] ?? "";
      const selected = current ? current.split(",") : [];
      const idx = selected.indexOf(option);
      if (idx >= 0) selected.splice(idx, 1); else selected.push(option);
      selected.sort();
      next = selected.length ? selected.join(",") : null;
    } else {
      next = option;
    }
    setAnswers((prev) => ({ ...prev, [questionId]: next }));
    await fetch(`/api/tests/${id}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "answer", questionId, selectedOption: next }),
    });
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-500">Loading test...</div>;
  if (!questions.length) return <div className="flex items-center justify-center min-h-screen text-gray-500">No questions found.</div>;

  const q = questions[current];
  const mins = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const secs = (timeLeft % 60).toString().padStart(2, "0");
  const answered = Object.values(answers).filter(Boolean).length;

  const opts: [Option, string][] = [
    ["A", q.optionA],
    ["B", q.optionB],
    ["C", q.optionC],
    ["D", q.optionD],
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-900 text-white px-4 py-3 flex items-center justify-between shadow">
        <span className="font-semibold">{testTitle}</span>
        <div className="flex items-center gap-4 text-sm">
          {warnings > 0 && (
            <span className="text-orange-300 text-xs font-semibold tracking-wide">
              ⚠ {warnings}/3 violations
            </span>
          )}
          <span className="opacity-70">{answered}/{questions.length} answered</span>
          <span className={`font-mono text-lg transition-colors ${timeLeft < 300 ? "text-red-400 font-black animate-pulse" : "font-bold"}`}>
            {mins}:{secs}
          </span>
        </div>
      </div>

      {/* Tab-switch warning banner */}
      {showWarning && (
        <div className={`px-4 py-2.5 flex items-center justify-between text-sm ${warnings >= 3 ? "bg-red-600 text-white" : "bg-orange-50 border-b border-orange-200 text-orange-800"}`}>
          <span className="font-medium">
            {warnings >= 3
              ? "3 violations detected — your test has been submitted automatically."
              : warnings === 2
              ? `Warning ${warnings}/3: Tab switching detected. One more violation will auto-submit your test.`
              : `Warning ${warnings}/3: Tab switching detected. Avoid switching tabs during the test.`}
          </span>
          {warnings < 3 && (
            <button onClick={() => setShowWarning(false)} className="ml-4 text-orange-500 hover:text-orange-700 font-bold text-xs shrink-0">
              Dismiss
            </button>
          )}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8 flex gap-6">
        {/* Question panel */}
        <div className="flex-1">
          <p className="text-xs text-gray-400 mb-2">Question {current + 1} of {questions.length}</p>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-4">
            <p className="text-gray-800 font-medium leading-relaxed">{q.questionText}</p>
            {q.isMultiSelect && (
              <p className="mt-2 text-xs text-blue-600 font-medium">Select all that apply</p>
            )}
          </div>
          <div className="space-y-3">
            {opts.map(([key, label]) => {
              const selected = answers[q.id] ?? "";
              const isSelected = q.isMultiSelect
                ? selected.split(",").includes(key)
                : selected === key;
              return (
                <button
                  key={key}
                  onClick={() => selectOption(q.id, key, q.isMultiSelect)}
                  className={`w-full text-left border rounded-xl px-5 py-3.5 transition text-sm font-medium flex items-center gap-3 ${
                    isSelected
                      ? "border-blue-600 bg-blue-50 text-blue-800"
                      : "border-gray-200 bg-white hover:border-blue-300 text-gray-700"
                  }`}
                >
                  {q.isMultiSelect ? (
                    <span className={`w-4 h-4 shrink-0 rounded border-2 flex items-center justify-center ${isSelected ? "bg-blue-600 border-blue-600" : "border-gray-400"}`}>
                      {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                    </span>
                  ) : (
                    <span className={`w-4 h-4 shrink-0 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-blue-600" : "border-gray-400"}`}>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-blue-600 block" />}
                    </span>
                  )}
                  <span><span className="font-bold mr-2">{key}.</span>{label}</span>
                </button>
              );
            })}
          </div>
          <div className="flex justify-between mt-6">
            <button
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={current === 0}
              className="px-5 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 disabled:opacity-40 hover:bg-gray-100 transition"
            >
              Previous
            </button>
            {current < questions.length - 1 ? (
              <button
                onClick={() => setCurrent((c) => c + 1)}
                className="px-5 py-2 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 transition"
              >
                Next
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={submitting}
                className="px-5 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit Test"}
              </button>
            )}
          </div>
        </div>

        {/* Question map */}
        <div className="w-44 shrink-0">
          <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Questions</p>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((q2, i) => (
              <button
                key={q2.id}
                onClick={() => setCurrent(i)}
                className={`w-8 h-8 rounded text-xs font-bold transition ${
                  i === current
                    ? "bg-blue-700 text-white"
                    : answers[q2.id]
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : "bg-white border border-gray-200 text-gray-500 hover:border-blue-300"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={submit}
            disabled={submitting}
            className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 rounded-lg transition disabled:opacity-60"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
