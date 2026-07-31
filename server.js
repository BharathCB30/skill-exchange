import express from "express";
import { createServer } from "http";
import compression from "compression";
import cors from "cors";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

import env from "./src/config/env.js";
import connectDB from "./src/config/db.js";
import passport from "./src/config/passport.js";
import initSocket from "./src/socket/socket.js";

// Route imports
import authRoutes from "./src/features/auth/auth.routes.js";
import userRoutes from "./src/features/users/user.routes.js";
import swapRoutes from "./src/features/swaps/swap.routes.js";
import chatRoutes from "./src/features/chat/chat.routes.js";
import notificationRoutes from "./src/features/notifications/notification.routes.js";
import reviewRoutes from "./src/features/reviews/review.routes.js";
import aiRoutes from "./src/features/ai/ai.routes.js";
import paymentRoutes from "./src/features/payments/payment.routes.js";
import adminRoutes from "./src/features/admin/admin.routes.js";
import communityRoutes from "./src/features/community/community.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Express Setup ──────────────────────────────────────────────────
const app = express();

// Middleware
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// CORS
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || env.ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

// Sessions
app.use(session({
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// ─── Database ──────────────────────────────────────────────────
connectDB();

// ─── Routes ──────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/swaps", swapRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/community", communityRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "SkillSwap API v3.0 — Phase 2 & 3 Enabled",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

// ─── Error Handler ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ─── HTTP + Socket.IO Server ──────────────────────────────────────────────────
const httpServer = createServer(app);
const io = initSocket(httpServer);

// Make io accessible in routes for notifications
app.set("io", io);

httpServer.listen(env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${env.PORT}`);
  console.log(`📡 Socket.IO ready`);
  console.log(`🌍 Environment: ${env.NODE_ENV}`);
});