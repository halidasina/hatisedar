const { OpenAI } = require("openai");

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return { 
      statusCode: 405, 
      headers: { "Access-Control-Allow-Origin": "*" },
      body: "Method Not Allowed" 
    };
  }

  try {
    const { prompt } = JSON.parse(event.body);
    if (!prompt) {
      return { 
        statusCode: 400, 
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Missing prompt" }) 
      };
    }

    const anthropicKey = process.env.ANTHROPIC_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const apiKey = anthropicKey || openaiKey;
    
    if (!apiKey) {
      console.error("DEBUG: AI API Keys missing. ANTHROPIC_KEY:", !!anthropicKey, "OPENAI_API_KEY:", !!openaiKey);
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ 
          error: "AI API Key not configured. Please add OPENAI_API_KEY or ANTHROPIC_KEY to Netlify environment variables.",
          debug: { anthropic: !!anthropicKey, openai: !!openaiKey }
        })
      };
    }

    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
    });

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a compassionate spiritual guide. Provide a reflective and encouraging response in Malay." },
        { role: "user", content: prompt }
      ]
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ text: response.choices[0].message.content })
    };
  } catch (error) {
    console.error("Error generating reflection:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Failed to generate reflection: " + error.message })
    };
  }
};
