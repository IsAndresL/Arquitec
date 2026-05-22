import { farmerService } from '../src/application/services/FarmerService';
import { authService } from '../src/application/services/AuthService';

async function main() {
  const farmerId = "6288ad7f-cc1b-49f0-99d8-145d1486972b"; // El trakki
  
  console.log("Updating PIN to 9999...");
  const updateResult = await farmerService.update(farmerId, { pin: "9999" });
  console.log("UPDATE RESULT:", JSON.stringify(updateResult, null, 2));
  
  console.log("Attempting login with old PIN 0000 (should fail)...");
  try {
    await authService.loginFarmer("El trakki", "0000");
    console.log("ERROR: logged in with old PIN!");
  } catch (err: any) {
    console.log("SUCCESS: old PIN failed as expected:", err.message);
  }
  
  console.log("Attempting login with new PIN 9999 (should succeed)...");
  try {
    const res = await authService.loginFarmer("El trakki", "9999");
    console.log("SUCCESS: logged in with new PIN!", JSON.stringify(res, null, 2));
  } catch (err: any) {
    console.error("ERROR: login failed with new PIN:", err);
  }
}

main();
