const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({});

async function generateCaption(base64ImageFile) {
  const contents = [
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64ImageFile,
      },
    },
    {
      text: "Analyze this document. If you find words that are visually unclear, use the surrounding context (like menu categories) to determine the correct professional spelling.",
    },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash", // Use 1.5-flash for the most stable Vision-to-JSON performance
    contents: contents,
    config: {
      systemInstruction: `
      You are a Document Intelligence Engine with Semantic Self-Correction.
      
      TRAINING RULES:
      1. SEMANTIC VALIDATION: When you extract a word, validate it against global food and catering terms. 
         Example: If you see "Wufles" or "Wadles" under a 'Starter' header, recognize it as "Waffles" or "Wafers" based on common menu items.
      
      2. MULTILINGUAL PHONETICS: You must understand English words written in Gujarati script. 
         Translate phonetic errors back to standard professional spellings (e.g., 'સિઝલર' should always be 'Sizzler').
      
      3. HIERARCHY PREDICTION: 
         - Detect 'Headers' based on font size, bolding, or central alignment.
         - Automatically group all text found below a Header into a clean Array.
         
      4. DATA STRUCTURE:
         - TOP_LEVEL: Main Business/Entity name.
         - METADATA: Contact, Date, Venue, Rates.
         - DYNAMIC_SECTIONS: All categorized menu items.

      Return ONLY RAW JSON. Do not include markdown blocks or any conversational text.
      `,
    },
  });

  return response.text;
}

module.exports = generateCaption;
