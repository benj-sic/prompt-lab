require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testApiKey() {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('No API key found in environment variables');
    return;
  }
  
  console.log('API Key length:', apiKey.length);
  console.log('API Key prefix:', apiKey.substring(0, 10) + '...');
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 50,
      }
    });
    
    console.log('Testing API call...');
    const result = await model.generateContent('Hello, please respond with "API test successful"');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ API test successful!');
    console.log('Response:', text);
  } catch (error) {
    console.error('❌ API test failed:');
    console.error('Error message:', error.message);
    console.error('Error details:', error);
  }
}

testApiKey();

