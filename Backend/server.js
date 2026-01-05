import express from "express";
import dotenv from "dotenv";
import connectDB from "./db.js";
import questionsRouter from "./src/routes/questions.js";

dotenv.config();
connectDB();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "http://localhost:5173");
  res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/", (req, res) => {
  res.json({ msg:"Home page" });
});

app.use("/api/questions", questionsRouter);

app.use((req, res) => {
  res.status(200).json({ msg: "404 Not Found" });
})
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});