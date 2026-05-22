import { farmerService } from '../src/application/services/FarmerService';
async function main() {
  await farmerService.update("6288ad7f-cc1b-49f0-99d8-145d1486972b", { pin: "0000" });
  console.log("RESTORED PIN OF EL TRAKKI TO 0000");
}
main();
