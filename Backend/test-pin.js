const data = {
  name: "Testing PIN Farmer",
  pin: "4321",
  createdById: "1f3b392a-3b32-4e02-9993-27eb0dc3990b" // Just needs to be valid structure
};

fetch('http://localhost:3000/api/farmers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // Need a valid technician token here! 
    // Actually, I can't test without a token because of createAuthHandler...
  },
  body: JSON.stringify(data)
}).then(r => r.json()).then(console.log).catch(console.error);
