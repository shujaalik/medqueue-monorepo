const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const expandMedicalNotes = async (shorthand) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 500
      }
    });

    const prompt = `
      You are an expert medical scribe. Convert the following shorthand medical notes into a professional, structured JSON object.
      const JSON object must have exactly these keys:
      {
        "symptoms": ["list of strings"],
        "diagnosis": "string",
        "prescription": ["list of items/dosages"],
        "advice": ["list of strings"],
        "questions": ["2-3 short follow-up questions for the doctor to ask the patient"]
      }
      
      Keep it professional but concise. 
      Shorthand: "${shorthand}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("AI Expansion Error:", error);
    throw new Error("Failed to expand notes using AI");
  }
};

module.exports = { expandMedicalNotes };
