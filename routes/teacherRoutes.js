import express from "express";
import CreateQuiz from "../models/CreateQuiz.js";
import Student from "../models/Student.js"; // assuming you have a Student model

const router = express.Router();

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
