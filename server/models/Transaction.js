import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    amount: { type: Number, required: true, min: 0.01 },
    category: { type: String, required: true },
    date: { type: String, required: true },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);