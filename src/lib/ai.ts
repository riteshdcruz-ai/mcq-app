import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type GeneratedQuestion = {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
};

export async function generateQuestionsFromText(
  text: string,
  count: number = 10
): Promise<GeneratedQuestion[]> {
  const truncated = text.slice(0, 12000);

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are an expert question setter. Read the following text and generate exactly ${count} multiple-choice questions (MCQs) to test comprehension.

Rules:
- Each question must have exactly 4 options (A, B, C, D)
- Only one option is correct
- Questions should test understanding, not just memory
- Include a brief explanation for the correct answer
- Return ONLY a valid JSON array, no other text

Format:
[
  {
    "questionText": "...",
    "optionA": "...",
    "optionB": "...",
    "optionC": "...",
    "optionD": "...",
    "correctOption": "A|B|C|D",
    "explanation": "..."
  }
]

Text to generate questions from:
---
${truncated}
---`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response from AI");

  const jsonMatch = content.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("No JSON array found in AI response");

  const questions = JSON.parse(jsonMatch[0]) as GeneratedQuestion[];
  return questions;
}
