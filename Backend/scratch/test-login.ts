import { authService } from '../src/application/services/AuthService';

async function main() {
  try {
    console.log("Attempting programmatic login...");
    const res = await authService.loginFarmer("El trakki", "0000");
    console.log("LOGIN SUCCESSFUL:", JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("LOGIN FAILED WITH ERROR:", err);
  }
}

main();
