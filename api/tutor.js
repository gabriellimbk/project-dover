import { generateTutorFeedback } from "../lib/tutor.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const { fieldKey, promptContext, studentAnswer } = body;

  if (!studentAnswer || String(studentAnswer).trim().length < 5) {
    return res.status(400).json({ error: "Please write your answer before requesting feedback." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY on server." });
  }

  try {
    const text = await generateTutorFeedback({ apiKey, fieldKey, promptContext, studentAnswer });
    return res.status(200).json({ text });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
}

