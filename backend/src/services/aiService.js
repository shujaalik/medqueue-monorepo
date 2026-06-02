const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const expandMedicalNotes = async (shorthand) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-lite-latest",
      generationConfig: { 
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 250
      }
    });

    const prompt = `
      You are an expert medical scribe. Convert the following shorthand medical notes into a professional, structured JSON object.
      The JSON object must have exactly these keys:
      {
        "symptoms": ["list of strings"],
        "diagnosis": "string",
        "prescription": ["list of items/dosages"],
        "advice": ["list of strings"],
        "questions": ["2-3 short follow-up questions for the doctor to ask the patient"],
        "suggestedTests": ["list of suggested laboratory, radiological, or clinical tests to confirm diagnosis"]
      }
      
      Keep all values extremely brief, professional, and clinically direct. No explanations, no conversational text, no fluff. Keep lists and descriptions as short as possible to minimize token usage.
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

const analyzeEmergency = async (symptoms) => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-lite-latest",
      generationConfig: { 
        responseMimeType: "application/json", 
        temperature: 0.1,
        maxOutputTokens: 80
      }
    });

    const prompt = `
      You are a medical triage assistant. Analyze the following patient symptoms and determine if it's an emergency.
      Return exactly this JSON:
      {
        "priority": "URGENT" or "NORMAL",
        "reason": "short explanation (maximum 1 sentence, highly concise)"
      }
      
      URGENT examples: chest pain, difficulty breathing, severe bleeding, unconsciousness, stroke symptoms, high fever in infants.
      Symptoms: "${symptoms}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("Triage AI Error:", error);
    return { priority: "NORMAL", reason: "AI triage unavailable" };
  }
};

const discussMedicalNotes = async (currentReport, query, shorthandNotes) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-lite-latest",
      generationConfig: { 
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 300
      }
    });

    const prompt = `
      You are an expert clinical AI scribe. The doctor is discussing or modifying the patient's medical report.
      Here is the shorthand clinical observation notes entered by the doctor:
      "${shorthandNotes || ''}"

      Here is the current structured medical report state:
      ${JSON.stringify(currentReport)}

      The doctor's request/query is: "${query}"

      Analyze the query and provide:
      1. A highly direct, clinical chat response (1-2 sentences maximum, strictly no greetings, no conversational fluff, no polite preambles, and no verbose explanations of changes).
      2. An updated structured report JSON object incorporating any requested changes to symptoms, diagnosis, prescription, advice, follow-up questions, or suggested tests. Keep all text values extremely brief.

      You must return exactly this JSON structure:
      {
        "chatResponse": "string (extremely concise, direct clinical answer in 1-2 sentences)",
        "updatedReport": {
          "symptoms": ["list of strings"],
          "diagnosis": "string",
          "prescription": ["list of items/dosages"],
          "advice": ["list of strings"],
          "questions": ["2-3 short follow-up questions"],
          "suggestedTests": ["list of suggested tests"]
        }
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("AI Discussion Error:", error);
    throw new Error("Failed to consult AI scribe");
  }
};

const analyzeClinicTrends = async (cases) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-lite-latest",
      generationConfig: { 
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 350
      }
    });

    const prompt = `
      You are an expert clinical epidemiologist and healthcare analyst. Analyze the following list of recent patient diagnoses and symptoms from a clinic:
      ${JSON.stringify(cases)}

      Based on this clinical data, identify common disease trends and provide:
      1. "topDiseases": A list of top 3 most common issues/diseases seen recently.
      2. "severityDistribution": A quick text breakdown of cases (e.g. Mild seasonal, chronic, acute).
      3. "aiInsights": 2-3 key epidemiological insights or recommendations for the clinic administration (e.g. stock up on flu meds, suggest vaccination drives).

      Return exactly this JSON structure (keep descriptions and text very short, 1-2 sentences maximum, strictly no small talk or fluff, to minimize token usage):
      {
        "topDiseases": [
          { "disease": "disease/symptom name", "count": number_of_occurrences, "description": "brief description of why this is high" }
        ],
        "severityDistribution": "string describing severity mix (maximum 1 sentence)",
        "aiInsights": ["list of clinical advice/insights for the admin (max 2 sentences per insight)"]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("AI Trend Analysis Error:", error);
    return {
      topDiseases: [],
      severityDistribution: "Undetermined - insufficient data",
      aiInsights: ["Unable to load AI-powered epidemiological insights at this moment."]
    };
  }
};

module.exports = { expandMedicalNotes, analyzeEmergency, discussMedicalNotes, analyzeClinicTrends };
