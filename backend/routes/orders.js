import { Router } from "express";
import { v4 as uuid } from "uuid";
import { requireAuth } from "../middleware/verifyToken.js";
import { createOrder, listOrdersForUser } from "../data/dynamo.js";

const router = Router();

// All order routes require a valid Cognito access token.
router.use(requireAuth);

// POST /api/orders  { items: [{id, qty}], notes }
router.post("/", async (req, res) => {
  const { items, notes = "" } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Order must include at least one item" });
  }

  const order = {
    orderId: uuid(),
    userSub: req.user.sub,
    username: req.user.username,
    items,
    notes,
    status: "received",
    createdAt: new Date().toISOString(),
  };

  try {
    await createOrder(order);
    res.status(201).json(order);
  } catch (err) {
    console.error("Order creation failed:", err.message);
    res.status(500).json({ error: "Could not place order" });
  }
});

// GET /api/orders — order history for the logged-in user
router.get("/", async (req, res) => {
  try {
    const orders = await listOrdersForUser(req.user.sub);
    res.json({ orders });
  } catch (err) {
    console.error("Order lookup failed:", err.message);
    res.status(500).json({ error: "Could not fetch orders" });
  }
});

export default router;
