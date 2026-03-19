const { getStore } = require("@netlify/blobs");

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { buyers } = JSON.parse(event.body);
    if (!Array.isArray(buyers)) {
      return { statusCode: 400, body: "Invalid data format" };
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
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to save buyers" })
    };
  }
};
