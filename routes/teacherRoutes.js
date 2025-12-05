import express from "express";
import CreateQuiz from "../models/CreateQuiz.js";
import Student from "../models/Student.js";
import QuizSubmission from "../models/QuizSubmission.js";
import { registerTeacher, loginTeacher } from "../controllers/teacherController.js";

const router = express.Router();

// POST register teacher
router.post("/register", registerTeacher);

// POST login teacher
router.post("/login", loginTeacher);

// Test route
router.get("/test/connection", (req, res) => {
  res.json({ message: "Teacher route is working" });
});

// GET teacher stats
router.get("/stats", async (req, res) => {
  try {
    const activeQuizzes = await CreateQuiz.countDocuments();
    const totalStudents = await Student.countDocuments();
    const pendingReviews = 0;

    res.json({ activeQuizzes, totalStudents, pendingReviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ GET quiz submissions for a specific teacher
router.get("/submissions/:teacherId", async (req, res) => {
  try {
    const { teacherId } = req.params;
    console.log("📨 Fetching submissions for teacher:", teacherId);

    // Get all quizzes created by this teacher
    const teacherQuizzes = await CreateQuiz.find({ teacherId });
    console.log("Found quizzes:", teacherQuizzes.length);
    
    const quizIds = teacherQuizzes.map(q => q._id);

    // Get all submissions for those quizzes
    const submissions = await QuizSubmission.find({ quizId: { $in: quizIds } })
      .populate("studentId", "firstName lastName")
      .populate("quizId", "title")
      .sort({ submittedAt: -1 });

    console.log("Found submissions:", submissions.length);

    // Calculate stats
    const totalSubmissions = submissions.length;
    const completedSubmissions = submissions.filter(s => s.submittedAt).length;
    const averageScore = totalSubmissions > 0 
      ? Math.round(submissions.reduce((sum, s) => sum + s.percentage, 0) / totalSubmissions)
      : 0;

    // Format submissions for frontend
    const formattedSubmissions = submissions.map(sub => ({
      _id: sub._id,
      studentName: `${sub.studentId.firstName} ${sub.studentId.lastName}`,
      quizTitle: sub.quizId.title,
      score: `${sub.score}/${sub.totalQuestions}`,
      percentage: sub.percentage,
      status: "Completed",
      submissionDate: new Date(sub.submittedAt).toISOString().split('T')[0],
    }));

    res.json({
      success: true,
      stats: {
        totalSubmissions,
        completedSubmissions,
        averageScore,
        studentsReviewed: new Set(submissions.map(s => s.studentId._id.toString())).size,
      },
      submissions: formattedSubmissions,
    });
  } catch (err) {
    console.error("❌ Error getting submissions:", err.message);
    console.error("Full error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

export default router;
