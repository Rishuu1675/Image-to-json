const express = require("express");
const route = require("./routes/image.routes");
const cors = require("cors");

const app = express();

const corsOriginEnv = process.env.CORS_ORIGIN;
const corsOrigins = corsOriginEnv
  ? corsOriginEnv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : null;

app.use(
  cors({
    origin: corsOrigins ?? true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

app.get("/healthz", (req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/api", route);

module.exports = app;
