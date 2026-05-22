import { generateUserToken } from './src/shared/utils/jwt';

async function test() {
  const token = generateUserToken("e72d7718-e415-40ca-9ed7-10f4dd7461fd", "test@test.com", "TECNICO_ADMIN");
  
  const data = {
    name: "Testing PIN Farmer 2",
    pin: "9876",
  };

  const response = await fetch('http://localhost:3000/api/farmers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  const text = await response.text();
  console.log("Status:", response.status);
  console.log("Response:", text);
}

test();
