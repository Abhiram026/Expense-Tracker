import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import auth from "../middleware/auth.js";
import { sendMail, otpEmailHtml } from "../utils/mailer.js";

const router = Router();

const CODE_LIFETIME = 10 * 60 * 1000; // 10 minutes
const RESEND_WAIT = 60 * 1000; // 1 minute between codes
const MAX_ATTEMPTS = 5;

function makeToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function cleanEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function emailLooksValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function newCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function hashCode(email, code) {
  return crypto.createHmac("sha256", process.env.JWT_SECRET).update(email + ":" + code).digest("hex");
}

// creates (or refreshes) a code for this email and returns the plain code to email out
async function issueCode(email, purpose, extra = {}) {
  const existing = await Otp.findOne({ email, purpose });
  if (existing) {
    const passed = Date.now() - existing.lastSentAt.getTime();
    if (passed < RESEND_WAIT) {
      const wait = Math.ceil((RESEND_WAIT - passed) / 1000);
      throw httpError(429, `Please wait ${wait} seconds before asking for a new code`);
    }
  }

  const code = newCode();
  await Otp.findOneAndUpdate(
    { email, purpose },
    {
      $set: {
        codeHash: hashCode(email, code),
        attempts: 0,
        lastSentAt: new Date(),
        expiresAt: new Date(Date.now() + CODE_LIFETIME),
        ...extra,
      },
    },
    { upsert: true, new: true }
  );
  return code;
}

// checks the code the user typed; throws a friendly error if it is wrong
async function checkCode(email, purpose, code) {
  const otp = await Otp.findOne({ email, purpose });
  if (!otp || otp.expiresAt < new Date()) {
    throw httpError(400, "This code has expired. Please ask for a new one");
  }
  if (otp.attempts >= MAX_ATTEMPTS) {
    await Otp.deleteOne({ _id: otp._id });
    throw httpError(400, "Too many wrong tries. Please ask for a new code");
  }
  if (otp.codeHash !== hashCode(email, String(code || "").trim())) {
    otp.attempts += 1;
    await otp.save();
    throw httpError(400, "Wrong code. Please check and try again");
  }
  return otp;
}

function sendError(res, err) {
  if (err.status) return res.status(err.status).json({ message: err.message });
  console.error(err);
  return res.status(500).json({ message: "Something went wrong on the server" });
}

/* ---------------- SIGNUP (email OTP) ---------------- */

// step 1: save the details temporarily and email a code. No account is created yet.
router.post("/signup/request", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = cleanEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!name || !email || !password) {
      throw httpError(400, "Name, email and password are required");
    }
    if (!emailLooksValid(email)) throw httpError(400, "Enter a valid email address");
    if (password.length < 6) throw httpError(400, "Password must be at least 6 characters");

    const existing = await User.findOne({ email });
    if (existing) throw httpError(400, "This email is already registered. Please log in");

    const passwordHash = await bcrypt.hash(password, 10);
    const code = await issueCode(email, "signup", { name, passwordHash });

    try {
      await sendMail(
        email,
        "Your Expense Tracker verification code",
        otpEmailHtml(code, "Verify your email", "Use this code to finish creating your account:")
      );
    } catch (mailErr) {
      await Otp.deleteOne({ email, purpose: "signup" });
      throw httpError(502, "We could not send the email. Check the address and try again");
    }

    res.json({ message: "We sent a 6-digit code to " + email });
  } catch (err) {
    sendError(res, err);
  }
});

// step 2: check the code, then create the account and log the user in
router.post("/signup/verify", async (req, res) => {
  try {
    const email = cleanEmail(req.body.email);
    const otp = await checkCode(email, "signup", req.body.code);

    const existing = await User.findOne({ email });
    if (existing) throw httpError(400, "This email is already registered. Please log in");

    const user = await User.create({ name: otp.name, email, password: otp.passwordHash });
    await Otp.deleteOne({ _id: otp._id });

    res.status(201).json({ token: makeToken(user), user: publicUser(user) });
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/signup/resend", async (req, res) => {
  try {
    const email = cleanEmail(req.body.email);
    const pending = await Otp.findOne({ email, purpose: "signup" });
    if (!pending) throw httpError(400, "Please fill the signup form again");

    const code = await issueCode(email, "signup");
    try {
      await sendMail(
        email,
        "Your Expense Tracker verification code",
        otpEmailHtml(code, "Verify your email", "Use this code to finish creating your account:")
      );
    } catch (mailErr) {
      throw httpError(502, "We could not send the email. Try again in a minute");
    }

    res.json({ message: "A new code was sent to " + email });
  } catch (err) {
    sendError(res, err);
  }
});

/* ---------------- LOGIN ---------------- */

router.post("/login", async (req, res) => {
  try {
    const email = cleanEmail(req.body.email);
    const password = String(req.body.password || "");
    if (!email || !password) {
      throw httpError(400, "Email and password are required");
    }

    const user = await User.findOne({ email });
    if (!user) throw httpError(400, "Wrong email or password");

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw httpError(400, "Wrong email or password");

    res.json({ token: makeToken(user), user: publicUser(user) });
  } catch (err) {
    sendError(res, err);
  }
});

/* ---------------- FORGOT PASSWORD (email OTP) ---------------- */

// always gives the same answer, so nobody can use this to find out which emails are registered
router.post("/forgot", async (req, res) => {
  const generic = { message: "If this email has an account, we sent a 6-digit code to it" };
  try {
    const email = cleanEmail(req.body.email);
    if (!emailLooksValid(email)) throw httpError(400, "Enter a valid email address");

    const user = await User.findOne({ email });
    if (user) {
      try {
        const code = await issueCode(email, "reset");
        await sendMail(
          email,
          "Reset your Expense Tracker password",
          otpEmailHtml(code, "Reset your password", "Use this code to set a new password:")
        );
      } catch (innerErr) {
        console.error("Forgot password email problem:", innerErr.message);
        if (innerErr.status === 429) throw innerErr;
      }
    }
    res.json(generic);
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/reset", async (req, res) => {
  try {
    const email = cleanEmail(req.body.email);
    const newPassword = String(req.body.newPassword || "");
    if (newPassword.length < 6) throw httpError(400, "Password must be at least 6 characters");

    const otp = await checkCode(email, "reset", req.body.code);
    const user = await User.findOne({ email });
    if (!user) throw httpError(400, "Account not found");

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    await Otp.deleteOne({ _id: otp._id });

    res.json({ message: "Password changed. Please log in with your new password" });
  } catch (err) {
    sendError(res, err);
  }
});

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user: publicUser(user) });
});

export default router;
