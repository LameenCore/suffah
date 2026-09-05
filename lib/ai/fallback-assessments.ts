// Hand-authored fallback unit assessments - used only when the Anthropic call
// fails or isn't configured (see lib/ai/assessment.ts). Keyed "<course>#<unit seq>",
// covering unit 1 of each demo course.

import type { UnitRef, PathwayNode } from "@/lib/db/queries";
import type { AssessmentBody, AssessmentContent } from "@/lib/ai/assessment";

const FALLBACKS: Record<string, AssessmentBody> = {
  "Math#1": {
    questions: [
      {
        id: "q1",
        type: "mcq",
        prompt: "What is (-4) + (-7)?",
        options: ["-11", "-3", "3", "11"],
        answerIndex: 0,
        explanation: "Same sign: add 4 + 7 = 11 and keep the negative sign.",
      },
      {
        id: "q2",
        type: "short",
        prompt: "What is 6 - 9?",
        answer: "-3",
        acceptable: [],
        explanation: "6 - 9 = 6 + (-9) = -3.",
      },
      {
        id: "q3",
        type: "mcq",
        prompt: "What is (-5) × 3?",
        options: ["-15", "-8", "8", "15"],
        answerIndex: 0,
        explanation: "A negative times a positive is negative: -(5 × 3) = -15.",
      },
      {
        id: "q4",
        type: "short",
        prompt: "What is (-20) ÷ (-4)?",
        answer: "5",
        acceptable: ["+5"],
        explanation: "A negative divided by a negative is positive: 20 ÷ 4 = 5.",
      },
      {
        id: "q5",
        type: "mcq",
        prompt: "Using order of operations, what is -2 + 3 × (-4)?",
        options: ["-14", "-20", "4", "20"],
        answerIndex: 0,
        explanation: "Multiply first: 3 × (-4) = -12. Then -2 + (-12) = -14.",
      },
      {
        id: "q6",
        type: "short",
        prompt: "What is 8 + (-2) × 5?",
        answer: "-2",
        acceptable: [],
        explanation: "Multiply first: (-2) × 5 = -10. Then 8 + (-10) = -2.",
      },
    ],
  },

  "Seerah#1": {
    questions: [
      {
        id: "q1",
        type: "mcq",
        prompt: "Which tribe controlled Mecca and the Kaaba before Islam?",
        options: ["Quraysh", "Aws", "Khazraj", "Banu Tamim"],
        answerIndex: 0,
        explanation: "The Quraysh held the roles tied to the Kaaba and the markets.",
      },
      {
        id: "q2",
        type: "short",
        prompt: "In which cave did the Prophet Muhammad ﷺ receive the first revelation?",
        answer: "Hira",
        acceptable: ["cave of hira", "hira cave", "ghar hira"],
        explanation: "The first revelation came in the cave of Hira, outside Mecca.",
      },
      {
        id: "q3",
        type: "mcq",
        prompt: "What was the first command revealed?",
        options: ["Read (Iqra)", "Pray", "Fight", "Give charity"],
        answerIndex: 0,
        explanation: "The first revealed word was 'Iqra' - Read / Recite.",
      },
      {
        id: "q4",
        type: "short",
        prompt: "What is the term for the era in Arabia before Islam?",
        answer: "Jahiliyyah",
        acceptable: ["jahiliyya", "age of ignorance", "days of ignorance"],
        explanation: "Jahiliyyah - often translated 'the age of ignorance'.",
      },
      {
        id: "q5",
        type: "mcq",
        prompt: "In Meccan society, a person's safety mainly came from…",
        options: ["their tribe", "the city guard", "a written law", "the king"],
        answerIndex: 0,
        explanation: "There was no state; the clan protected its members.",
      },
      {
        id: "q6",
        type: "short",
        prompt: "Name one hardship the early Muslim community faced in Mecca.",
        answer: "persecution",
        acceptable: [
          "boycott",
          "social boycott",
          "economic boycott",
          "torture of the weak",
          "torture",
          "being driven out",
          "mockery",
        ],
        explanation:
          "The early community faced mockery, torture of its weakest members, and a social and economic boycott.",
      },
    ],
  },

  "AI Literacy#1": {
    questions: [
      {
        id: "q1",
        type: "mcq",
        prompt: "A language model mainly works by…",
        options: [
          "predicting the next piece of text",
          "searching a fact database",
          "reciting a fixed script",
          "asking a person each time",
        ],
        answerIndex: 0,
        explanation: "It builds its answer one small piece at a time from learned patterns.",
      },
      {
        id: "q2",
        type: "mcq",
        prompt: "Training data is…",
        options: [
          "large amounts of text collected from many sources",
          "a single official textbook",
          "the user's current question only",
          "the model's own earlier answers",
        ],
        answerIndex: 0,
        explanation: "Models learn patterns from very large, mixed collections of text.",
      },
      {
        id: "q3",
        type: "short",
        prompt: "What is the word for a confident-sounding answer a model made up?",
        answer: "hallucination",
        acceptable: ["hallucinating", "confabulation"],
        explanation: "That's the term for a plausible answer with no reliable pattern behind it.",
      },
      {
        id: "q4",
        type: "mcq",
        prompt: "If a model sounds very confident, its answer…",
        options: [
          "might still be wrong",
          "is definitely correct",
          "was checked against a source",
          "came from a human expert",
        ],
        answerIndex: 0,
        explanation: "Fluency is about how the text reads, not whether it was verified.",
      },
      {
        id: "q5",
        type: "short",
        prompt: "Name one kind of detail you should always double-check in a model's answer.",
        answer: "numbers",
        acceptable: ["names", "dates", "quotes", "facts", "statistics"],
        explanation: "A pattern-predictor is most likely to get these subtly wrong.",
      },
      {
        id: "q6",
        type: "mcq",
        prompt: "A model that can use tools like search is more trustworthy because it can…",
        options: [
          "actually check facts, not just recall them",
          "think faster",
          "write longer answers",
          "never make mistakes",
        ],
        answerIndex: 0,
        explanation: "Checking a live source is a stronger mode than recalling a pattern.",
      },
    ],
  },
};

export function fallbackUnitAssessment(
  unit: UnitRef,
  nodes: PathwayNode[],
): AssessmentContent | null {
  const body = FALLBACKS[`${unit.course.name}#${unit.sequence_order}`];
  if (!body) return null;
  return {
    ...body,
    schemaVersion: 1,
    kind: "unit",
    generatedBy: "fallback",
    generatedAt: new Date().toISOString(),
    coversTitles: nodes.filter((n) => n.lesson_content).map((n) => n.title),
  };
}
