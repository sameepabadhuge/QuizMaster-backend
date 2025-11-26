import express from "express";
import QuizResult from "../models/QuizResultDetail.js";

const router = express.Router();

// GET quiz result by ID
router.get("/:resultId", async (req, res) => {
  try {
    const result = await QuizResult.findById(req.params.resultId);

    if (!result) {
      return res.status(404).json({ success: false, message: "Result not found" });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST a new quiz result (optional for testing)
router.post("/", async (req, res) => {
  try {
    console.log("Incoming request data:", req.body);

    // Validate request data
    if (!req.body.quizTitle || !req.body.score || !req.body.totalQuestions || !req.body.percentage) {
      console.error("Validation error: Missing required fields");
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const newResult = new QuizResult(req.body);
    await newResult.save();
    res.json({ success: true, data: newResult });
  } catch (err) {
    console.error("Error saving quiz result:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

export default router;
