import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

// Routes
import studentRoutes from "./routes/studentRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import { login } from "./controllers/auth.controller.js";

dotenv.config();
connectDB();

const app = express();

// ===== Middleware =====
app.use(cors());
app.use(express.json());

// ===== API Routes =====
app.use("/api/students", studentRoutes);   // Register Student
app.use("/api/teachers", teacherRoutes);   // Register Teacher
app.post("/api/login", login);             // Login (Student + Teacher)

// ===== Root Test Route =====
app.get("/", (req, res) => {
  res.send("Server is running...");
});



// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
