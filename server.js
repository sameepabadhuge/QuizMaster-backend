import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import createQuizRoutes from "./routes/CreateQuizRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { login } from "./controllers/auth.controller.js";

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes); 
app.use("/api/createquiz", createQuizRoutes);
app.use("/api/students/quiz-result", quizRoutes);

app.post("/api/login", login);

// Root
app.get("/", (req, res) => res.send("🚀 QuizMaster Server Running..."));

// 404
app.use((req, res) => res.status(404).json({ success: false, message: "Route Not Found" }));

// Error handler
app.use((err, req, res, next) => {
  console.error("🔥 SERVER ERROR:", err.stack);
  res.status(500).json({ success: false, message: "Server Error", error: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
