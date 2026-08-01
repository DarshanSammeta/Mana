import { getEventTypes } from "../src/lib/marketplace";

async function main() {
  const types = await getEventTypes();
  console.log("EVENT_TYPES_FROM_LIB:", JSON.stringify(types, null, 2));
}

main().catch(console.error);
