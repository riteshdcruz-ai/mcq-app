"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";

type Answer = {
  id: string;
  selectedOption: string | null;
  manualOverride: boolean;
  question: {
    id: string;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: string;
  };
};

type Attempt = {
  id: string;
  score: number;
  totalQuestions: number;
  submittedAt: string;
  user: { name: string; email: string };
  test: { title: string; passPercentage: number };
  answers: Answer[];
};

function optionText(answer: Answer, opt: string) {
  const map: Record<string, string> = {
    A: answer.question.optionA,
    B: answer.question.optionB,
    C: answer.question.optionC,
    D: answer.question.optionD,
  };
  return map[opt] ?? opt;
}

function normalize(s: string) {
  return s.split(",").sort().join(",");
}

function isCorrect(answer: Answer) {
  return (
    answer.selectedOption !== null &&
    normalize(answer.selectedOption) === normalize(answer.question.correctOption)
  );
}

export default function AttemptReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [me, setMe] = useState<{ name: string } | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  async function fetchAttempt() {
    const data = await fetch(`/api/admin/attempts/${id}`).then((r) => r.json());
    setAttempt(data);
  }

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setMe(d.user));
    fetchAttempt();
  }, [id]);

  async function toggleOverride(answer: Answer) {
    setSaving(answer.id);
    const res = await fetch(`/api/admin/attempts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answerId: answer.id, override: !answer.manualOverride }),
    });
    const { score } = await res.json();
    setAttempt((prev) =>
      prev
        ? {
            ...prev,
            score,
            answers: prev.answers.map((a) =>
              a.id === answer.id ? { ...a, manualOverride: !a.manualOverride } : a
            ),
          }
        : prev
    );
    setSaving(null);
  }

  if (!attempt) {
    return (
      <>
        <Nav name={me?.name || "Admin"} role="admin" />
        <main className="max-w-4xl mx-auto px-4 py-8 text-gray-400">Loading...</main>
      </>
    );
  }

  const pct = attempt.totalQuestions > 0 ? Math.round((attempt.score / attempt.totalQuestions) * 100) : 0;
  const passed = pct >= (attempt.test.passPercentage ?? 60);
  const overrideCount = attempt.answers.filter((a) => a.manualOverride).length;

  return (
    <>
      <Nav name={me?.name || "Admin"} role="admin" />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin/results" className="text-gray-400 hover:text-gray-600 text-sm">
            ← Back to Results
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">{attempt.test.title}</h1>
              <p className="text-gray-600 mt-1">{attempt.user.name}</p>
              <p className="text-gray-400 text-sm">{attempt.user.email}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-800">
                {attempt.score}/{attempt.totalQuestions}
              </div>
              <div className="text-lg font-semibold text-gray-500">{pct}%</div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {passed ? "Passed" : "Failed"}
              </span>
              {overrideCount > 0 && (
                <div className="text-xs text-blue-600 mt-1">{overrideCount} mark{overrideCount > 1 ? "s" : ""} manually granted</div>
              )}
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {attempt.answers.map((answer, i) => {
            const correct = isCorrect(answer);
            const skipped = answer.selectedOption === null;
            const overridden = answer.manualOverride;
            const wrongAndNotOverridden = !correct && !skipped && !overridden;

            let borderColor = "border-gray-200";
            if (correct || overridden) borderColor = "border-green-200";
            else if (!skipped) borderColor = "border-red-200";

            const options = ["A", "B", "C", "D"];
            const correctOpts = answer.question.correctOption.split(",").map((s) => s.trim());
            const selectedOpts = answer.selectedOption ? answer.selectedOption.split(",").map((s) => s.trim()) : [];

            return (
              <div key={answer.id} className={`bg-white rounded-xl border ${borderColor} shadow-sm p-5`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-medium text-gray-400">Q{i + 1}</span>
                      {correct && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Correct</span>
                      )}
                      {overridden && !correct && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Mark Granted</span>
                      )}
                      {skipped && !overridden && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Skipped</span>
                      )}
                      {wrongAndNotOverridden && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Wrong</span>
                      )}
                    </div>

                    <p className="text-sm text-gray-800 font-medium mb-3">{answer.question.questionText}</p>

                    <div className="space-y-1.5">
                      {options.map((opt) => {
                        const isCorrectOpt = correctOpts.includes(opt);
                        const isSelected = selectedOpts.includes(opt);
                        let bg = "bg-gray-50 text-gray-600";
                        if (isCorrectOpt && isSelected) bg = "bg-green-100 text-green-800 font-semibold";
                        else if (isCorrectOpt) bg = "bg-green-50 text-green-700 font-semibold";
                        else if (isSelected) bg = "bg-red-100 text-red-700 font-semibold";

                        return (
                          <div key={opt} className={`flex items-start gap-2 px-3 py-1.5 rounded-lg text-sm ${bg}`}>
                            <span className="font-bold shrink-0 w-5">{opt}.</span>
                            <span>{optionText(answer, opt)}</span>
                            {isCorrectOpt && <span className="ml-auto shrink-0 text-xs text-green-600">✓ correct</span>}
                            {isSelected && !isCorrectOpt && <span className="ml-auto shrink-0 text-xs text-red-500">✗ selected</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Grant / Revoke button — only for non-correct answers */}
                  {!correct && (
                    <div className="shrink-0 pt-6">
                      <button
                        onClick={() => toggleOverride(answer)}
                        disabled={saving === answer.id}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-50 ${
                          overridden
                            ? "bg-blue-100 text-blue-700 hover:bg-red-100 hover:text-red-600"
                            : "bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700"
                        }`}
                      >
                        {saving === answer.id ? "..." : overridden ? "Revoke Mark" : "Grant Mark"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
