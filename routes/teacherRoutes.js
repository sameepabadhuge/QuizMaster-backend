import express from "express";
import mongoose from "mongoose";
import CreateQuiz from "../models/CreateQuiz.js";
import Student from "../models/Student.js";
import QuizSubmission from "../models/QuizSubmission.js";
import { registerTeacher, loginTeacher, getTeacherProfile, updateTeacherProfile, changeTeacherPassword } from "../controllers/teacherController.js";

const router = express.Router();

// POST register teacher
router.post("/register", registerTeacher);

// POST login teacher
router.post("/login", loginTeacher);

// GET teacher profile
router.get("/profile/:teacherId", getTeacherProfile);

// PUT update teacher profile
router.put("/profile/:teacherId", updateTeacherProfile);

// PUT change password
router.put("/change-password/:teacherId", changeTeacherPassword);

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

// ✅ GET detailed quiz result by studentId and quizId (for teachers to view)
router.get("/submission-detail/:studentId/:quizId", async (req, res) => {
  try {
    const { studentId, quizId } = req.params;
    console.log("📊 Fetching submission detail for student:", studentId, "quiz:", quizId);

    const QuizResultDetail = (await import("../models/QuizResultDetail.js")).default;
    
    const result = await QuizResultDetail.findOne({ studentId, quizId })
      .populate("studentId", "firstName lastName email")
      .sort({ createdAt: -1 });
    
    if (!result) {
      return res.status(404).json({ success: false, message: "Result details not found" });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("❌ Get Submission Detail Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ✅ GET quiz submissions for a specific teacher
router.get("/submissions/:teacherId", async (req, res) => {
  try {
    const { teacherId } = req.params;
    console.log("📨 Fetching submissions for teacher:", teacherId);

    // Convert teacherId to ObjectId if it's a valid string
    let teacherObjectId;
    try {
      teacherObjectId = new mongoose.Types.ObjectId(teacherId);
    } catch (e) {
      console.log("Using teacherId as string");
      teacherObjectId = teacherId;
    }

    // Get all quizzes created by this teacher (check both string and ObjectId)
    const teacherQuizzes = await CreateQuiz.find({ 
      $or: [
        { teacherId: teacherObjectId },
        { teacherId: teacherId }
      ]
    });
    console.log("Found quizzes:", teacherQuizzes.length);
    
    if (teacherQuizzes.length === 0) {
      return res.json({
        success: true,
        stats: {
          totalSubmissions: 0,
          completedSubmissions: 0,
          averageScore: 0,
          studentsReviewed: 0,
        },
        submissions: [],
      });
    }
    
    const quizIds = teacherQuizzes.map(q => q._id);
    console.log("Quiz IDs:", quizIds);

    // Get all submissions for those quizzes
    const submissions = await QuizSubmission.find({ quizId: { $in: quizIds } })
      .populate("studentId", "firstName lastName")
      .populate("quizId", "title")
      .sort({ submittedAt: -1 });

    console.log("Found submissions:", submissions.length);

    // Filter out submissions with missing student or quiz data
    const validSubmissions = submissions.filter(sub => sub.studentId && sub.quizId);

    // Calculate stats
    const totalSubmissions = validSubmissions.length;
    const completedSubmissions = validSubmissions.filter(s => s.submittedAt).length;
    const averageScore = totalSubmissions > 0 
      ? Math.round(validSubmissions.reduce((sum, s) => sum + s.percentage, 0) / totalSubmissions)
      : 0;

    // Format submissions for frontend
    const formattedSubmissions = validSubmissions.map(sub => ({
      _id: sub._id,
      studentId: sub.studentId._id,
      quizId: sub.quizId._id,
      studentName: sub.studentId ? `${sub.studentId.firstName} ${sub.studentId.lastName}` : "Unknown Student",
      quizTitle: sub.quizId ? sub.quizId.title : sub.quizTitle || "Unknown Quiz",
      score: `${sub.score}/${sub.totalQuestions}`,
      percentage: sub.percentage,
      status: "Completed",
      submissionDate: new Date(sub.submittedAt).toISOString().split('T')[0],
    }));

    // Calculate unique students
    const uniqueStudents = new Set(validSubmissions.filter(s => s.studentId).map(s => s.studentId._id.toString())).size;

    res.json({
      success: true,
      stats: {
        totalSubmissions,
        completedSubmissions,
        averageScore,
        studentsReviewed: uniqueStudents,
      },
      submissions: formattedSubmissions,
    });
  } catch (err) {
    console.error("❌ Error getting submissions:", err.message);
    console.error("Full error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// ✅ GET leaderboard for a specific teacher's quizzes with optional subject filter
router.get("/leaderboard/:teacherId", async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { subject } = req.query;
    console.log("🏆 Fetching leaderboard for teacher:", teacherId, "subject:", subject || "all");

    // Convert teacherId to ObjectId
    let teacherObjectId;
    try {
      teacherObjectId = new mongoose.Types.ObjectId(teacherId);
    } catch (e) {
      teacherObjectId = teacherId;
    }

    // Build quiz query - filter by teacher and optionally by subject
    const quizQuery = {
      $or: [
        { teacherId: teacherObjectId },
        { teacherId: teacherId }
      ]
    };
    
    if (subject && subject !== "all") {
      quizQuery.subject = subject;
    }

    // Get all quizzes created by this teacher (optionally filtered by subject)
    const teacherQuizzes = await CreateQuiz.find(quizQuery);
    console.log("Found quizzes:", teacherQuizzes.length);

    // Get unique subjects from teacher's quizzes for the filter dropdown
    const allTeacherQuizzes = await CreateQuiz.find({
      $or: [
        { teacherId: teacherObjectId },
        { teacherId: teacherId }
      ]
    }).select("subject");
    
    const subjects = [...new Set(allTeacherQuizzes.map(q => q.subject).filter(Boolean))];
    
    if (teacherQuizzes.length === 0) {
      return res.json({
        success: true,
        leaderboard: [],
        subjects
      });
    }

    const quizIds = teacherQuizzes.map(q => q._id);

    // Aggregate submissions for these quizzes
    const leaderboard = await QuizSubmission.aggregate([
      {
        $match: { quizId: { $in: quizIds } }
      },
      {
        $group: {
          _id: "$studentId",
          totalScore: { $sum: "$score" },
          totalQuestions: { $sum: "$totalQuestions" },
          quizzesAttempted: { $sum: 1 },
          averagePercentage: { $avg: "$percentage" }
        }
      },
      {
        $lookup: {
          from: "students",
          localField: "_id",
          foreignField: "_id",
          as: "studentInfo"
        }
      },
      { $unwind: "$studentInfo" },
      {
        $project: {
          _id: 0,
          studentId: "$_id",
          firstName: "$studentInfo.firstName",
          lastName: "$studentInfo.lastName",
          email: "$studentInfo.email",
          profilePhoto: "$studentInfo.profilePhoto",
          totalScore: 1,
          totalQuestions: 1,
          quizzesAttempted: 1,
          averagePercentage: { $round: ["$averagePercentage", 2] }
        }
      },
      { $sort: { totalScore: -1 } },
      { $limit: 50 }
    ]);

    // Add rank
    const leaderboardWithRank = leaderboard.map((student, index) => ({
      ...student,
      rank: index + 1
    }));

    res.json({
      success: true,
      leaderboard: leaderboardWithRank,
      subjects
    });

  } catch (error) {
    console.error("❌ Teacher Leaderboard Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

export default router;
