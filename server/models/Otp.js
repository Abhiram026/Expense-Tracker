import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  purpose: { type: String, enum: ["signup", "reset"], required: true },
  codeHash: { type: String, required: true },
  // only used for signup: the details are kept here until the email is verified
  name: { type: String },
  passwordHash: { type: String },
  attempts: { type: Number, default: 0 },
  lastSentAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

otpSchema.index({ email: 1, purpose: 1 }, { unique: true });
// MongoDB deletes the record by itself once expiresAt has passed
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Otp", otpSchema);
