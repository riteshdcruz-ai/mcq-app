"use client";
export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-lg text-sm font-medium"
    >
      Print / Save as PDF
    </button>
  );
}
