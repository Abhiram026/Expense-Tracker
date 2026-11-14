import { Router } from "express";
import Budget from "../models/Budget.js";
import auth from "../middleware/auth.js";

const router = Router();
router.use(auth);

// returns { Food: 5000, Rent: 12000 }
router.get("/", async (req, res) => {
  const list = await Budget.find({ user: req.userId });
  const result = {};
  list.forEach((b) => {
    result[b.category] = b.limit;
  });
  res.json(result);
});

router.put("/:category", async (req, res) => {
  try {
    const limit = Number(req.body.limit);
    if (!limit || limit <= 0) {
      return res.status(400).json({ message: "Enter a valid limit" });
    }
    await Budget.findOneAndUpdate(
      { user: req.userId, category: req.params.category },
      { limit },
      { upsert: true, new: true }
    );
    res.json({ category: req.params.category, limit });
  } catch (err) {
    res.status(400).json({ message: "Could not save budget" });
  }
});

router.delete("/:category", async (req, res) => {
  await Budget.findOneAndDelete({ user: req.userId, category: req.params.category });
  res.json({ message: "Deleted" });
});

export default router;