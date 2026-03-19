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
    const { buyerId, oldPassword, newPassword } = JSON.parse(event.body);
    if (!buyerId || !newPassword) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Missing buyerId or newPassword" })
      };
    }

    await client.connect();

    // Find the buyer
    const buyerResult = await client.query(
      "SELECT * FROM buyers WHERE id = $1",
      [buyerId]
    );

    if (buyerResult.rows.length === 0) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Buyer not found" })
      };
    }

    const buyer = buyerResult.rows[0];

    // Verify old password if provided
    if (oldPassword && buyer.password !== oldPassword) {
      return {
        statusCode: 403,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Old password incorrect" })
      };
    }

    // Update password
    await client.query(
      "UPDATE buyers SET password = $1 WHERE id = $2",
      [newPassword, buyerId]
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ message: "Password updated successfully" })
    };
  } catch (error) {
    console.error("Error updating password:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Failed to update password: " + error.message })
    };
  } finally {
    await client.end();
  }
};
