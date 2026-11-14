import { Router } from "express";
import Transaction from "../models/Transaction.js";
import auth from "../middleware/auth.js";

const router = Router();
router.use(auth);

router.get("/", async (req, res) => {
  const items = await Transaction.find({ user: req.userId }).sort({ date: -1, createdAt: -1 });
  res.json(items);
});

router.post("/", async (req, res) => {
  try {
    const { type, amount, category, date, note } = req.body;
    const item = await Transaction.create({ user: req.userId, type, amount, category, date, note });
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ message: "Invalid transaction data" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { type, amount, category, date, note } = req.body;
    const item = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { type, amount, category, date, note },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: "Transaction not found" });
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: "Could not update transaction" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const item = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!item) return res.status(404).json({ message: "Transaction not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(400).json({ message: "Could not delete transaction" });
  }
});

export default router;