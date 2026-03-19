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

  const client = new Client({
    connectionString: process.env.NETLIFY_DATABASE_URL_UNPOOLED
  });

  try {
    await client.connect();

    // Create buyers table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS buyers (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at DATE NOT NULL,
        active BOOLEAN DEFAULT true,
        created_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Database initialized successfully");

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ message: "Database initialized successfully" })
    };
  } catch (error) {
    console.error("Error initializing database:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Failed to initialize database: " + error.message })
    };
  } finally {
    await client.end();
  }
};
