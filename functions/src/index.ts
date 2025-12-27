import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { GoogleGenAI } from "@google/genai";


const ExamSchema = {
  type: "object",
  properties: {
    course_code: { type: "string" },
    course_name: { type: "string" },
    exam_date: { type: "string" }, // e.g. "2024-06-23" or "" if unknown
    exam_year: { type: "string" }, // e.g. "2024"
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question_number: { type: "string" },
          text: { type: "string" },
          marks: { type: ["number", "null"] },
          figures: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },       // e.g. "Figure 1"
                description: { type: "string" }, // short caption/context
              },
              required: [],
            },
          },
          equations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                latex: { type: "string" },       // LaTeX-like expression
                description: { type: "string" }, // optional explanation
              },
              required: ["latex"],
            },
          },
          sub_questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                sub_number: { type: "string" },    // "(a)", "a", "i", etc.
                text: { type: "string" },
                marks: { type: ["number", "null"] },
                figures: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      label: { type: "string" },
                      description: { type: "string" },
                    },
                    required: [],
                  },
                },
                equations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      latex: { type: "string" },
                      description: { type: "string" },
                    },
                    required: ["latex"],
                  },
                },
              },
              required: ["sub_number", "text"],
            },
          },
        },
        required: ["question_number", "text"],
      },
    },
  },
  required: ["course_code", "course_name", "questions"],
};

const PARSE_PROMPT = `
You are converting a university exam paper PDF into structured JSON.

Follow these rules strictly:

1. METADATA
- Extract:
  - "course_code": short code such as "CSCI101" or "ENGR2013".
  - "course_name": full course title.
  - "exam_date": exam date in "YYYY-MM-DD" format if possible, otherwise "".
  - "exam_year": four-digit year, e.g. "2024". If unknown, use "".
- If multiple dates appear (e.g. print date vs exam date), choose the one clearly marked as the exam date.

2. QUESTIONS
- Extract ALL questions in exam order.
- Each "question" MUST have:
  - "question_number": the label shown in the paper ("1", "Q1", "Section A – Q1", etc.).
  - "text": full wording of the main question, including any common stem shared by sub-questions.
  - "marks": total marks for this question if clearly indicated, else null.
  - "figures": any diagrams, charts, tables, circuit diagrams, etc. referenced in this question.
  - "equations": any key mathematical expressions used in this question.
  - "sub_questions": each part such as (a), (b), (c), etc.

3. SUB-QUESTIONS
- For each sub-question:
  - "sub_number": the label exactly as in the paper, like "(a)", "(b)", "(i)", "(ii)".
  - "text": the full wording for that sub-question.
  - "marks": marks if shown (e.g. "[5 marks]"), else null.
  - "figures" and "equations": capture any figures or equations specific to that sub-question.

4. FIGURES
- Treat diagrams, graphs, tables, images, and complex schematics as "figures".
- For each figure:
  - "label": use the label if present ("Figure 1", "Table 2"). If there is no explicit label, use a short invented label like "figure_q1a_1".
  - "description": short plain-text description based on the caption or nearby text.

5. EQUATIONS
- For each equation:
  - "latex": convert the visible math into a LaTeX-like string (e.g. "E = mc^2", "\\int_a^b f(x) dx").
  - "description": a short explanation if it helps understand the equation, otherwise "".

6. HALLUCINATIONS
- Do NOT invent new questions, figures, or equations.
- If something is partially cut, transcribe as faithfully as you can.
- If a field is missing, use:
  - "" for unknown strings,
  - null for unknown numbers (e.g. marks),
  - [] for empty arrays.

Return ONLY valid JSON that exactly follows the given JSON Schema.
`;

// Use Secret Manager for the API Key
export const parseExamPaper = onRequest({ 
  secrets: ["GEMINI_API_KEY"],
  cors: true,
  timeoutSeconds: 300 // Exam papers can take a minute to process
}, async (req, res) => {
  
  const { fileBase64 } = req.body;
  if (!fileBase64) {
    res.status(400).send("No PDF data provided.");
    return;
  }

  let cleanBase64 = fileBase64;
  if (cleanBase64.includes(",")) {
        cleanBase64 = cleanBase64.split(",")[1];
    }

  // Initialize the Client inside the request to use the Secret
  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const result = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{
        role: "user",
        parts: [
        { text: PARSE_PROMPT },
        { inlineData: { data: cleanBase64, mimeType: "application/pdf" } }
        ]
    }],
    config: {
        responseMimeType: "application/json",
        responseSchema: ExamSchema
    }
    });

    // SAFE ACCESS:
    const candidate = result.candidates?.[0];
    const responseText = candidate?.content?.parts?.[0]?.text;

    if (!responseText) {
    // Check why it failed (usually safety filters)
    const finishReason = candidate?.finishReason || "UNKNOWN";
    logger.error(`AI failed to generate content. Reason: ${finishReason}`);
    res.status(500).json({ error: `Generation failed: ${finishReason}` });
    return;
    }

    try {
    res.json(JSON.parse(responseText));
    } catch (e) {
    logger.error("JSON Parse Error", responseText);
    res.status(500).json({ error: "Invalid JSON returned from AI" });
    }
});