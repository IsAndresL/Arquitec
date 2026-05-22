async function main() {
  try {
    console.log("Sending real HTTP request...");
    const response = await fetch("http://localhost:3000/api/auth/login/farmer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        farmerId: "El trakki",
        pin: "0000"
      })
    });
    
    console.log("HTTP STATUS:", response.status);
    const text = await response.text();
    console.log("RESPONSE BODY:", text);
  } catch (err) {
    console.error("HTTP REQUEST FAILED:", err);
  }
}

main();
