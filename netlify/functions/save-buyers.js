const { getStore } = require("@netlify/blobs");

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

  try {
    const { buyers } = JSON.parse(event.body);
    if (!Array.isArray(buyers)) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Invalid data format" })
      };
    }

    const store = getStore("hatisedar_store");
    await store.setJSON("buyers", buyers);

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
    const msg = error.message || "";
    if (msg.includes("token") || msg.includes("site") || msg.includes("401") || msg.includes("403") || msg.includes("unauthorized")) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Netlify Blobs belum diaktifkan. Sila aktifkan di Netlify Dashboard > Site Settings > Blobs." })
      };
    }
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Failed to save buyers: " + msg })
    };
  }
};
