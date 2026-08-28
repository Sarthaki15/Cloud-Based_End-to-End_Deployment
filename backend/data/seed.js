/**
 * seed.js — one-time script to load menu.json into DynamoDB.
 * Run with: npm run seed
 */
import "dotenv/config";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { putMenuItem } from "./dynamo.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const items = JSON.parse(fs.readFileSync(path.join(__dirname, "menu.json"), "utf-8"));

async function run() {
  console.log(`Seeding ${items.length} menu items into DynamoDB...`);
  for (const item of items) {
    await putMenuItem(item);
    console.log(`  ✓ ${item.name}`);
  }
  console.log("Seed complete.");
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
