import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { listMenuItems } from "../data/dynamo.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

// Falls back to the bundled JSON file if DynamoDB isn't configured yet,
// so the app is runnable locally before AWS resources exist.
async function getMenu() {
  if (process.env.DYNAMO_MENU_TABLE) {
    try {
      const items = await listMenuItems();
      if (items.length) return items;
    } catch (err) {
      console.warn("DynamoDB read failed, falling back to local JSON:", err.message);
    }
  }
  const raw = fs.readFileSync(path.join(__dirname, "../data/menu.json"), "utf-8");
  return JSON.parse(raw);
}

// GET /api/menu?category=Coffee&veg=true&spicy=false&q=chai
router.get("/", async (req, res) => {
  const { category, veg, spicy, q } = req.query;
  let items = await getMenu();

  if (category) items = items.filter((i) => i.category.toLowerCase() === category.toLowerCase());
  if (veg === "true") items = items.filter((i) => i.veg);
  if (spicy === "true") items = items.filter((i) => i.spicy);
  if (q) {
    const needle = q.toLowerCase();
    items = items.filter(
      (i) => i.name.toLowerCase().includes(needle) || i.description.toLowerCase().includes(needle)
    );
  }

  res.json({ count: items.length, items });
});

router.get("/categories", async (_req, res) => {
  const items = await getMenu();
  const categories = [...new Set(items.map((i) => i.category))];
  res.json({ categories });
});

export default router;
