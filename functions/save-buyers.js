const { Client } = require("pg");

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
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

  const client = new Client({
    connectionString: process.env.NETLIFY_DATABASE_URL_UNPOOLED
  });

  try {
    const { buyers } = JSON.parse(event.body);
    if (!Array.isArray(buyers)) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Invalid data format" })
      };
    }

    await client.connect();

    // Clear existing buyers and insert new ones
    await client.query("DELETE FROM buyers");

    for (const buyer of buyers) {
      await client.query(
        `INSERT INTO buyers (id, name, email, password, created_at, active)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [buyer.id, buyer.name, buyer.email, buyer.password, buyer.createdAt, buyer.active]
      );
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ message: "Buyers saved successfully" })
    };
  } catch (error) {
    console.error("Error saving buyers:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Failed to save buyers: " + error.message })
    };
  } finally {
    await client.end();
  }
};
