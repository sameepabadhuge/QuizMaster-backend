import express from "express";
import QuizResult from "../models/QuizResultDetail.js";
import { verifyStudent } from "../middleware/auth.js"; // import middleware

const router = express.Router();

// GET quiz result by ID (protected)
router.get("/:resultId", verifyStudent, async (req, res) => {
  try {
    const result = await QuizResult.findById(req.params.resultId);

    if (!result) return res.status(404).json({ success: false, message: "Result not found" });

    // Optional: ensure only the student who submitted can view
    if (result.studentId.toString() !== req.student.id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST a new quiz result (protected)
router.post("/", verifyStudent, async (req, res) => {
  try {
    const { quizTitle, score, totalQuestions, percentage } = req.body;

    if (!quizTitle || score == null || totalQuestions == null || percentage == null) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const newResult = new QuizResult({
      ...req.body,
      studentId: req.student.id, // attach logged-in student
    });

    await newResult.save();
    res.json({ success: true, data: newResult });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

export default router;
