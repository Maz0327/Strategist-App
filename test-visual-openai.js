import OpenAI from 'openai';

// Test OpenAI Vision API directly
async function testVisionAPI() {
  const openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY 
  });

  try {
    console.log('Testing OpenAI Vision API...');
    
    const response = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-4o", // Must use gpt-4o for vision
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Describe what you see in this test image. Just give me a brief description."
              },
              {
                type: "image_url",
                image_url: {
                  url: "https://via.placeholder.com/300x200/0079F2/FFFFFF?text=Visual+Test",
                  detail: "low"
                }
              }
            ]
          }
        ],
        max_tokens: 200,
        temperature: 0.1
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Vision API timeout')), 30000)
      )
    ]);

    console.log('✅ OpenAI Vision API Success:');
    console.log('Response:', response.choices[0].message.content);
    console.log('Tokens used:', response.usage?.total_tokens);
    
  } catch (error) {
    console.error('❌ OpenAI Vision API Error:', error.message);
  }
}

testVisionAPI();