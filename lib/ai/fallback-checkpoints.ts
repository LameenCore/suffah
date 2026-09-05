// Hand-authored fallback checkpoints - used only when the Anthropic call fails
// or isn't configured (see lib/ai/checkpoint.ts). Keyed "<course>#<sequence_order>",
// covering node 1 of each course so the demo loop survives offline.

import type { PathwayNode } from "@/lib/db/queries";
import type { CheckpointBody, CheckpointContent } from "@/lib/ai/checkpoint";

const FALLBACKS: Record<string, CheckpointBody> = {
  "Math#1": {
    questions: [
      {
        id: "q1",
        type: "mcq",
        prompt: "What is (-8) + (-5)?",
        options: ["-13", "-3", "3", "13"],
        answerIndex: 0,
        explanation: "Same sign: add the distances (8 + 5 = 13) and keep the negative sign.",
      },
      {
        id: "q2",
        type: "short",
        prompt: "What is -6 + 15?",
        answer: "9",
        acceptable: ["+9"],
        explanation: "Different signs: 15 - 6 = 9, and 15 is farther from 0, so the result is positive.",
      },
      {
        id: "q3",
        type: "mcq",
        prompt: "Subtracting a negative number is the same as…",
        options: [
          "adding its opposite",
          "subtracting its opposite",
          "multiplying by zero",
          "doing nothing",
        ],
        answerIndex: 0,
        explanation: "a - (-b) = a + b. Subtracting -5 is the same as adding 5.",
      },
      {
        id: "q4",
        type: "short",
        prompt: "What is the opposite of -12?",
        answer: "12",
        acceptable: ["+12"],
        explanation: "The opposite is the same distance from 0 on the other side.",
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
        prompt: "In one word, what was a person's main source of protection in Meccan society?",
        answer: "tribe",
        acceptable: ["clan", "qabilah", "family"],
        explanation: "With no state or courts, the clan was what kept a person safe.",
      },
      {
        id: "q3",
        type: "mcq",
        prompt: "Mecca mattered to the wider region mainly because of…",
        options: ["trade and pilgrimage", "farming", "its seaport", "its large army"],
        answerIndex: 0,
        explanation: "It sat on the caravan routes and drew pilgrims to the Kaaba.",
      },
      {
        id: "q4",
        type: "short",
        prompt: "Name one injustice in pre-Islamic Meccan society.",
        answer: "burying infant daughters alive",
        acceptable: [
          "female infanticide",
          "killing baby girls",
          "mistreatment of slaves",
          "harsh treatment of enslaved people",
          "unfair debts",
          "exploiting the poor",
        ],
        explanation: "The lesson names infanticide, mistreatment of enslaved people, and unfair debts.",
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
          "looking facts up in a database",
          "copying an encyclopedia word for word",
          "asking a human every time",
        ],
        answerIndex: 0,
        explanation: "It builds the answer one small piece at a time from learned patterns.",
      },
      {
        id: "q2",
        type: "short",
        prompt: "True or false: if an AI sounds confident, its answer is probably correct.",
        answer: "false",
        acceptable: ["f"],
        explanation: "Fluency is about how the text reads, not whether it was checked.",
      },
      {
        id: "q3",
        type: "mcq",
        prompt: "A confident-sounding but made-up answer from a model is called a…",
        options: ["hallucination", "citation", "token", "prompt"],
        answerIndex: 0,
        explanation: "That's the term for a plausible answer the model had no real pattern for.",
      },
      {
        id: "q4",
        type: "short",
        prompt: "Name one kind of detail you should always double-check in an AI's answer.",
        answer: "numbers",
        acceptable: ["names", "dates", "quotes", "facts", "statistics"],
        explanation: "A pattern-predictor is most likely to get these subtly wrong.",
      },
    ],
  },
};

export function fallbackCheckpoint(node: PathwayNode): CheckpointContent | null {
  const body = FALLBACKS[`${node.course.name}#${node.sequence_order}`];
  if (!body) return null;
  return {
    ...body,
    schemaVersion: 1,
    generatedBy: "fallback",
    generatedAt: new Date().toISOString(),
  };
}
