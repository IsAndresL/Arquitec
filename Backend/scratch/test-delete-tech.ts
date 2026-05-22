import { generateUserToken } from '../src/shared/utils/jwt';

async function test() {
  const token = generateUserToken("e72d7718-e415-40ca-9ed7-10f4dd7461fd", "tecnico@magdalena-smart-farming.com", "TECNICO_ADMIN");
  
  console.log("SENDING DELETE REQUEST...");
  const response = await fetch('http://localhost:3000/api/technicians/ac3b84e0-2dc9-47fd-b2c9-4cbdd9f622f2', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  const text = await response.text();
  console.log("Status:", response.status);
  console.log("Response:", text);
}

test().catch(err => {
  console.error(err);
});
