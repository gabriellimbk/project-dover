import OpenAI from "openai";

function buildPrompt(fieldKey, promptContext, studentAnswer) {
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

  return `
    Role: Socratic Economics Tutor. Topic: Dover Forest.
    Instruction: ${specificInstruction}
    Student's Answer: "${studentAnswer}".
    ${sentenceLimit}
  `;
}

export async function generateTutorFeedback({ apiKey, fieldKey, promptContext, studentAnswer }) {
  const client = new OpenAI({ apiKey });
  const prompt = buildPrompt(fieldKey, promptContext, studentAnswer);

  const result = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content: "You are a Socratic Economics Tutor. Be encouraging, concise, and do not reveal full answers directly."
      },
      {
        role: "user",
        content: prompt
      }
    ]
  });

  return result.choices?.[0]?.message?.content?.trim() || "Try expanding on your reasoning.";
}

