import express from "express";
import dotenv from "dotenv";
import connectDB from "./db.js";

dotenv.config();
connectDB();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ msg:"Home page" });
});

app.use((req, res) => {
    res.status(200).json({ msg: "404 Not Found" });
})
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});