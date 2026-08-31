// ======================
// Front Row — Express server
// ======================
// Week 1 goal: a running server with basic routes. Real routes (events,
// artists, search) get added in Week 2.

import "./config/env.js"; // load .env FIRST, before anything reads process.env
import express from "express";
import eventsRouter from "./routes/events.js";

const app = express();

// Parse JSON request bodies (needed later for POST endpoints)
app.use(express.json());

// Health check — this is also what we'll hit from the browser after
// deploying to EC2 to prove the server is alive
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "frontrow-backend", time: new Date().toISOString() });
});

// Same payload as /health, but mounted under /api. This is the path that
// frontend/vercel.json proxies through to EC2, so hitting /api/health on the
// deployed site proves the whole chain — browser -> Vercel rewrite -> EC2 —
// works before any real /api routes exist.
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "frontrow-backend", time: new Date().toISOString() });
});

// Resource routes. One router per resource, mounted under its /api path.
app.use("/api/events", eventsRouter);

app.get("/", (_req, res) => {
  res.json({ message: "Front Row API — hello world 🎤" });
});

// PORT comes from the root .env (currently 3000). The fallback matches it
// so dev behavior is the same either way — if you change one, change both,
// and keep the Vite proxy in frontend/vite.config.ts pointed at the same port.
const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Front Row backend running → http://localhost:${PORT}`);
});
