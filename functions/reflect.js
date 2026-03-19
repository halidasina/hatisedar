const { OpenAI } = require("openai");

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { prompt } = JSON.parse(event.body);
    if (!prompt) {
      return { statusCode: 400, body: "Missing prompt" };
    }

    const client = new OpenAI({
      apiKey: process.env.ANTHROPIC_KEY || process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
    });

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a compassionate spiritual guide. Provide a short, reflective, and encouraging response in Malay based on the user's journal entry. Keep it under 100 words." },
        { role: "user", content: prompt }
      ]
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ reflection: response.choices[0].message.content })
    };
  } catch (error) {
    console.error("Error generating reflection:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate reflection" })
    };
  }
};
