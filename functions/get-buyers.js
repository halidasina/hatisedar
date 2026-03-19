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

    // Fetch all buyers from the database
    const result = await client.query("SELECT * FROM buyers ORDER BY created_timestamp DESC");
    const buyers = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password,
      createdAt: row.created_at,
      active: row.active
    }));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ buyers })
    };
  } catch (error) {
    console.error("Error fetching buyers:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Failed to fetch buyers: " + error.message })
    };
  } finally {
    await client.end();
  }
};
