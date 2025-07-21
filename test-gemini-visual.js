import { GoogleGenAI } from "@google/genai";

// Test Gemini Visual Analysis directly
async function testGeminiVision() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  try {
    console.log('Testing Gemini Visual Analysis...');
    
    // Test with a simple placeholder image
    const testImageUrl = "https://via.placeholder.com/300x200/0079F2/FFFFFF?text=Gemini+Test";
    
    // Fetch and convert image to base64
    const response = await fetch(testImageUrl);
    const buffer = await response.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString("base64");

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: "image/png",
          },
        },
        "Describe what you see in this test image. Just give me a brief description."
      ],
    });

    console.log('✅ Gemini Visual Analysis Success:');
    console.log('Response:', result.text);
    
  } catch (error) {
    console.error('❌ Gemini Visual Analysis Error:', error.message);
  }
}

testGeminiVision();