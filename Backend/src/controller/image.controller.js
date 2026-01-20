const generateCaption = require("../service/ai.service");

async function createPostController(req, res) {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No image file provided." });
    }

    // 1. Convert to Base64
    const base64Image = Buffer.from(file.buffer).toString("base64");

    // 2. Get the RAW string from AI Service
    const rawAiResponse = await generateCaption(base64Image);

    // 3. MASTER CLEANING LOGIC
    // This regex removes the ```json and ``` marks so we only have the raw { } block
    const cleanJson = rawAiResponse.replace(/```json|```/g, "").trim();

    // 4. PARSE the string into a real Object
    const extractedData = JSON.parse(cleanJson);

    // 5. Send the structured data back
    return res.status(200).json({
      success: true,
      data: extractedData, // This is now a clean JSON object
      message: "Image data extracted successfully",
    });
  } catch (error) {
    console.error("Controller Error:", error);

    // Fallback: if JSON.parse fails, still send the raw text so you don't lose data
    return res.status(200).json({
      success: true,
      raw_text: error.message.includes("Unexpected token")
        ? "Parsing failed, check format"
        : error.message,
    });
  }
}

module.exports = { createPostController };