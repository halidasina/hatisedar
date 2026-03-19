const { getStore } = require("@netlify/blobs");

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { buyerId, oldPassword, newPassword } = JSON.parse(event.body);
    if (!buyerId || !newPassword) {
      return { statusCode: 400, body: "Missing buyerId or newPassword" };
    }

    const store = getStore("hatisedar_store");
    const buyers = await store.get("buyers", { type: "json" }) || [];
    
    const buyer = buyers.find(b => b.id === buyerId);
    if (!buyer) {
      return { statusCode: 404, body: JSON.stringify({ error: "Buyer not found" }) };
    }

    if (oldPassword && buyer.password !== oldPassword) {
      return { statusCode: 403, body: JSON.stringify({ error: "Old password incorrect" }) };
    }

    const updatedBuyers = buyers.map(b => 
      b.id === buyerId ? { ...b, password: newPassword } : b
    );

    await store.setJSON("buyers", updatedBuyers);

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
      body: JSON.stringify({ error: "Failed to update password" })
    };
  }
};
