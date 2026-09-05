// Hand-authored fallback lessons.
//
// Used only when the Anthropic call fails or isn't configured (see lib/ai/lesson.ts).
// Keyed by "<course name>#<sequence_order>" so the demo's first node in each course
// always has a real lesson to show even offline. Later nodes have no fallback — a
// missing key surfaces the underlying model error rather than hiding it.

import type { PathwayNode } from "@/lib/db/queries";
import type { LessonBody, LessonContent } from "@/lib/ai/lesson";

const FALLBACKS: Record<string, { body: LessonBody; regulationNote?: string }> = {
  "Math#1": {
    regulationNote:
      "This lesson is aligned to the Québec Secondary 1 mathematics program as a demo " +
      "mapping. Confirm scope and sequence against the current Progression of Learning " +
      "before relying on it for a home-instruction portfolio.",
    body: {
      summary:
        "Integers are the whole numbers together with their negatives: …, -3, -2, -1, 0, 1, 2, 3, …. " +
        "Once you can picture them on a number line, adding and subtracting them is just moving " +
        "right (for positives) or left (for negatives).",
      objectives: [
        "Place positive and negative integers on a number line",
        "Add two integers, including when their signs differ",
        "Rewrite a subtraction as 'add the opposite' and evaluate it",
      ],
      sections: [
        {
          heading: "The number line",
          body:
            "Draw a line, mark 0 in the middle, positives to the right, negatives to the left. " +
            "Every integer has an opposite the same distance from 0: the opposite of 5 is -5, the " +
            "opposite of -8 is 8. Adding a positive number moves you right; adding a negative " +
            "number moves you left.",
        },
        {
          heading: "Adding integers",
          body:
            "If the signs are the same, add the distances from 0 and keep that sign: -4 + -3 = -7. " +
            "If the signs are different, subtract the smaller distance from the larger and keep the " +
            "sign of the number that was farther from 0: -9 + 4 = -5, because 9 is farther from 0 " +
            "than 4 and 9 is negative.",
        },
        {
          heading: "Subtracting is adding the opposite",
          body:
            "a - b means a + (the opposite of b). So 6 - 10 becomes 6 + (-10) = -4. And 3 - (-5) " +
            "becomes 3 + 5 = 8. Turning every subtraction into an addition means you only ever have " +
            "to know one set of rules.",
        },
      ],
      worked_example: {
        prompt: "Evaluate -7 - (-2) + (-4).",
        solution:
          "Rewrite each subtraction as adding the opposite: -7 + 2 + (-4). Work left to right: " +
          "-7 + 2 = -5 (different signs, 7 is farther from 0, so negative). Then -5 + (-4) = -9 " +
          "(same sign, add distances). The answer is -9.",
      },
      practice: [
        {
          prompt: "What is -6 + 15?",
          answer: "9",
          explanation:
            "Different signs: 15 is farther from 0 than 6, so the answer is positive. 15 - 6 = 9.",
        },
        {
          prompt: "What is -8 + (-5)?",
          answer: "-13",
          explanation: "Same sign: add the distances, 8 + 5 = 13, and keep the negative sign.",
        },
        {
          prompt: "Rewrite 4 - (-9) as an addition and evaluate it.",
          answer: "4 + 9 = 13",
          explanation: "Subtracting -9 is the same as adding its opposite, +9. 4 + 9 = 13.",
        },
        {
          prompt: "What is the opposite of -12?",
          answer: "12",
          explanation: "The opposite of a number is the same distance from 0 with the other sign.",
        },
      ],
      key_terms: [
        { term: "Integer", definition: "A whole number or its negative: …, -2, -1, 0, 1, 2, …" },
        { term: "Opposite", definition: "The number the same distance from 0 but on the other side." },
        {
          term: "Number line",
          definition: "A line with 0 marked, positives to the right and negatives to the left.",
        },
      ],
    },
  },

  "Seerah#1": {
    body: {
      summary:
        "Before the Prophet Muhammad ﷺ received revelation, Mecca was a trading city built around " +
        "the Ka'bah. Understanding what that society was like — its strengths and its injustices — " +
        "makes it clear why the message that came later was such a turning point.",
      objectives: [
        "Describe Mecca's role as a centre of trade and pilgrimage",
        "Explain how tribal loyalty organised Meccan life",
        "Give two examples of social problems in pre-Islamic Mecca",
      ],
      sections: [
        {
          heading: "A city around the Ka'bah",
          body:
            "Mecca sat on the caravan routes between Yemen and Syria. Pilgrims travelled there to " +
            "visit the Ka'bah, which by that time held many idols. Pilgrimage and trade went " +
            "together: the months of pilgrimage were also the great market season, and the tribe " +
            "of Quraysh managed both.",
        },
        {
          heading: "Tribe before everything",
          body:
            "There was no police force and no court. Your safety came from your tribe: an attack on " +
            "one member was answered by the whole clan. This kept powerful families secure but left " +
            "the weak — orphans, widows, the poor, enslaved people, and anyone without a strong " +
            "tribe — with little protection.",
        },
        {
          heading: "Strengths and injustices",
          body:
            "Meccans valued generosity, courage, loyalty, and poetry, and they kept careful oral " +
            "records of lineage and history. But the same society buried some infant daughters " +
            "alive, treated enslaved people harshly, and let the rich exploit the poor through " +
            "unfair debts. Both pictures are true at once.",
        },
      ],
      worked_example: {
        prompt:
          "A traveller with no tribal ties is robbed on the road near Mecca. Why is it hard for " +
          "him to get justice?",
        solution:
          "Justice in Mecca depended on your tribe being willing and strong enough to demand it. " +
          "A person with no tribe present has no one to press his claim and no threat of " +
          "retaliation to deter the robber, so the wrong usually went unanswered.",
      },
      practice: [
        {
          prompt: "Name the tribe that managed trade and pilgrimage in Mecca.",
          answer: "Quraysh",
          explanation: "The Quraysh held the leading positions tied to the Ka'bah and the markets.",
        },
        {
          prompt: "In one word, what was the main source of a person's protection in Meccan society?",
          answer: "Tribe",
          explanation: "With no state institutions, the clan was what kept a person safe.",
        },
        {
          prompt: "Give one example of an injustice in pre-Islamic Meccan society.",
          answer: "Burying infant daughters alive (also acceptable: mistreatment of enslaved people; unfair debts)",
          explanation: "These are the examples named in the lesson's third section.",
        },
      ],
      key_terms: [
        { term: "Ka'bah", definition: "The cube-shaped house of worship at the centre of Mecca." },
        {
          term: "Quraysh",
          definition: "The dominant tribe of Mecca, in charge of pilgrimage and trade.",
        },
        {
          term: "Tribe (qabilah)",
          definition: "An extended family group that provided identity and protection.",
        },
      ],
    },
  },

  "AI Literacy#1": {
    body: {
      summary:
        "A language model does not look up facts or 'know' things the way a person does. It has " +
        "learned patterns in text, and it uses them to predict the next chunk of writing, one " +
        "step at a time. Everything it does well and everything it gets wrong comes from that.",
      objectives: [
        "Explain what 'next-token prediction' means in plain words",
        "Describe why a model can sound confident and still be wrong",
        "Tell the difference between a model recalling a pattern and a model checking a source",
      ],
      sections: [
        {
          heading: "Predicting the next piece",
          body:
            "During training the model reads an enormous amount of text and plays one game over " +
            "and over: given the words so far, guess what comes next. After enough rounds it gets " +
            "very good at that game. When you chat with it, it is still playing the same game — " +
            "building its answer a small piece at a time, each piece chosen because it fits the " +
            "pattern of what came before.",
        },
        {
          heading: "Fluent is not the same as correct",
          body:
            "The model is optimised to produce writing that reads well, not writing that is " +
            "checked against reality. So a smooth, confident sentence and a made-up 'fact' can " +
            "look exactly the same coming out of the model. This is why you verify anything that " +
            "matters, especially names, numbers, dates, and quotes.",
        },
        {
          heading: "Recall vs. checking",
          body:
            "If a fact appeared often and consistently in training text, the model usually repeats " +
            "it reliably. If it was rare, contested, or after the training cut-off, the model may " +
            "fill the gap with something plausible. A model that can use tools (search, a " +
            "calculator, a database) can actually check — that is a different and more trustworthy " +
            "mode than recall alone.",
        },
      ],
      worked_example: {
        prompt:
          "You ask a model for the population of your town and it gives an exact number instantly. " +
          "Should you trust it? Explain.",
        solution:
          "Be cautious. An instant, exact number with no source is recall from training patterns, " +
          "which may be outdated or wrong for a smaller place. Trust it more if the model looked " +
          "it up in a current source and shows you where the number came from.",
      },
      practice: [
        {
          prompt: "In three words, what is a language model mainly doing when it answers you?",
          answer: "Predicting the next token (also acceptable: 'predicting next words')",
          explanation: "It generates the response one small piece at a time based on learned patterns.",
        },
        {
          prompt: "True or false: if a model sounds confident, its answer is probably correct.",
          answer: "False",
          explanation: "Fluency is about how the text reads, not whether it was checked against reality.",
        },
        {
          prompt:
            "Name one kind of detail you should always double-check in a model's answer.",
          answer: "Numbers (also acceptable: names, dates, quotes)",
          explanation: "These are exactly the details a pattern-predictor is most likely to get subtly wrong.",
        },
      ],
      key_terms: [
        {
          term: "Token",
          definition: "A small chunk of text — a word or part of a word — that the model reads and writes.",
        },
        {
          term: "Next-token prediction",
          definition: "Choosing the next chunk of text that best fits the pattern of what came before.",
        },
        {
          term: "Hallucination",
          definition: "A confident-sounding answer the model made up because it had no reliable pattern.",
        },
      ],
    },
  },
};

export function fallbackLesson(node: PathwayNode): LessonContent | null {
  const entry = FALLBACKS[`${node.course.name}#${node.sequence_order}`];
  if (!entry) return null;
  return {
    ...entry.body,
    schemaVersion: 1,
    generatedBy: "fallback",
    generatedAt: new Date().toISOString(),
    regulationNote: entry.regulationNote,
  };
}
