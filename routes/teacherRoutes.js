import express from "express";
import CreateQuiz from "../models/CreateQuiz.js";
import Student from "../models/Student.js";
import { registerTeacher, loginTeacher } from "../controllers/teacherController.js";

const router = express.Router();

// POST register teacher
router.post("/register", registerTeacher);

// POST login teacher
router.post("/login", loginTeacher);

// GET teacher stats
router.get("/stats", async (req, res) => {
  try {
    const activeQuizzes = await CreateQuiz.countDocuments();
    const totalStudents = await Student.countDocuments();
    const pendingReviews = 0; // Placeholder, update if you track submissions

    res.json({ activeQuizzes, totalStudents, pendingReviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
