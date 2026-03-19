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

  try {
    const store = getStore("hatisedar_store");
    const buyers = await store.get("buyers", { type: "json" });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ buyers: buyers || [] })
    };
  } catch (error) {
    console.error("Error fetching buyers:", error);
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
      body: JSON.stringify({ error: "Failed to fetch buyers: " + msg })
    };
  }
};
