const { getStore } = require("@netlify/blobs");

exports.handler = async (event, context) => {
  try {
    const store = getStore("hatisedar_store");
    const buyers = await store.get("buyers", { type: "json" }) || [];
    
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
      body: JSON.stringify({ error: "Failed to fetch buyers" })
    };
  }
};
