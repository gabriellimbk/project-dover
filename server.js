import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localEnvPath = path.join(__dirname, ".env.local");
if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
} else {
  dotenv.config();
}

const isProd = process.env.NODE_ENV === "production";
const app = express();
app.use(express.json());

app.post("/api/tutor", async (req, res) => {
  const { fieldKey, promptContext, studentAnswer } = req.body || {};
  if (!studentAnswer || String(studentAnswer).trim().length < 5) {
    return res.status(400).json({ error: "Please write your answer before requesting feedback." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing GEMINI_API_KEY on server." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    let specificInstruction = "";
    let sentenceLimit = "";

    if (fieldKey === "partA") {
      sentenceLimit = "Limit your response to exactly 3 sentences.";
      specificInstruction = `
        Evaluate the student's answer based on the following: 
        As long as the student covers 'unlimited wants' and 'limited resources' with the use of examples, it is a good answer. 
        Provide encouraging feedback if they meet this. If they missed one, ask a socratic question to lead them to it.
        Do not give the answer directly.
      `;
    } else {
      sentenceLimit = "Limit your response to between 3 and 5 sentences.";
      specificInstruction = `
        Provide a rough hint or ask a probing question. 
        Do not be overly detailed as this is an introductory course.
        Context: ${promptContext}.
      `;
    }

    const prompt = `
      Role: Socratic Economics Tutor. Topic: Dover Forest.
      Instruction: ${specificInstruction}
      Student's Answer: "${studentAnswer}".
      ${sentenceLimit}
    `;

    let result;
    try {
      result = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });
    } catch (innerError) {
      result = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
    }

    return res.json({ text: result.text || "Try expanding on your reasoning." });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

if (!isProd) {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    try {
      const url = req.originalUrl;
      const indexPath = path.resolve(__dirname, "index.html");
      const template = fs.readFileSync(indexPath, "utf-8");
      const html = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(
        html
      );
    } catch (e) {
      next(e);
    }
  });
} else {
  const distPath = path.join(__dirname, "dist");
  app.use(express.static(distPath));
  app.get("/*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const port = process.env.PORT || 5173;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
