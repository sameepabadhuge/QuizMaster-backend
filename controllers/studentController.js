import Student from "../models/Student.js";
import CreateQuiz from "../models/CreateQuiz.js";
import QuizSubmission from "../models/QuizSubmission.js";
import QuizResultDetail from "../models/QuizResultDetail.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export const registerStudent = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password, confirmPassword } = req.body;

    if (!firstName || !lastName || !username || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existingUser = await Student.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: "Email or Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStudent = new Student({
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
    });

    await newStudent.save();

    res.status(201).json({ message: "Student registered successfully" });
  } catch (error) {
    console.error("Error during student registration:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const student = await Student.findOne({ email });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const isMatch = await bcrypt.compare(password, student.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    const token = jwt.sign(
      { id: student._id, role: "student" },
      process.env.JWT_SECRET || "default_jwt_secret",
      { expiresIn: "7d" }
    );

    console.log("🔍 Retrieved student from database:", student);
    console.log("🔑 Generated token:", token);
    console.log("📤 Sending response with student data:", {
      id: student._id,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
    });

    return res.status(200).json({
      success: true,
      message: "Student logged in successfully",
      token,
      student: {
        id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
      }
    });

  } catch (error) {
    console.error("Student Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const submitQuiz = async (req, res) => {
  try {
    console.log("📝 Submit Quiz Request Body:", req.body);

    const { quizId, answers, studentId } = req.body;

    if (!quizId || !answers) {
      console.log("❌ Missing quizId or answers");
      return res.status(400).json({ success: false, message: "Quiz ID and answers are required" });
    }

    if (!studentId) {
      console.log("❌ studentId is missing in the request body.");
      return res.status(400).json({ success: false, message: "Student ID is required to submit the quiz." });
    }

    const validStudentId = mongoose.Types.ObjectId.isValid(studentId) ? new mongoose.Types.ObjectId(studentId) : null;
    if (!validStudentId) {
      console.log("❌ Invalid studentId format:", studentId);
      return res.status(400).json({ success: false, message: "Invalid Student ID format." });
    }

    console.log("🔍 Finding quiz with ID:", quizId);
    const quiz = await CreateQuiz.findById(quizId);
    if (!quiz) {
      console.log("❌ Quiz not found");
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }

    console.log("✅ Quiz found:", quiz.title);
    let score = 0;
    const results = quiz.questions.map((question, index) => {
      const userAnswer = answers[index];
      const correctAnswer = question.options[question.correctAnswer];
      const isCorrect = userAnswer === correctAnswer;

      if (isCorrect) score++;

      return {
        question: question.question,
        userAnswer: userAnswer || "Not answered",
        correctAnswer,
        isCorrect
      };
    });

    const totalQuestions = quiz.questions.length;
    const percentage = ((score / totalQuestions) * 100).toFixed(2);

    console.log("✅ Quiz graded - Score:", score, "/", totalQuestions);

    // 💾 Save/Update detailed results to database
    let resultId = null;
    if (studentId) {
      try {
        console.log("Saving/Updating QuizResultDetail with data:", {
          studentId,
          quizId,
          quizTitle: quiz.title,
          score,
          totalQuestions,
          percentage: parseFloat(percentage),
          results
        });
        
        // Find existing result and update, or create new one
        const resultDetail = await QuizResultDetail.findOneAndUpdate(
          { studentId, quizId }, // Find by student and quiz
          {
            quizTitle: quiz.title,
            score,
            totalQuestions,
            percentage: parseFloat(percentage),
            results,
            createdAt: new Date() // Update submission time
          },
          { 
            new: true, // Return updated document
            upsert: true, // Create if doesn't exist
            setDefaultsOnInsert: true 
          }
        );
        resultId = resultDetail._id;
        console.log("✅ Detailed result saved/updated with ID:", resultId);
      } catch (saveErr) {
        console.error("⚠️ Error saving result details:", saveErr);
        console.error("Error details:", saveErr.message);
      }
    } else {
      console.log("⚠️ No studentId provided, skipping result save");
    }

    // 💾 Save/Update submission to database if studentId provided
    if (studentId) {
      try {
        // Find existing submission and update, or create new one
        const submission = await QuizSubmission.findOneAndUpdate(
          { studentId, quizId }, // Find by student and quiz
          {
            quizTitle: quiz.title,
            score,
            totalQuestions,
            percentage: parseFloat(percentage),
            submittedAt: new Date() // Update submission time
          },
          { 
            new: true, // Return updated document
            upsert: true, // Create if doesn't exist
            setDefaultsOnInsert: true 
          }
        );
        console.log("✅ Quiz submission saved/updated:", submission._id);
      } catch (saveErr) {
        console.error("⚠️ Error saving submission:", saveErr);
        // Don't fail the request if saving fails
      }
    }

    res.json({
      success: true,
      score,
      totalQuestions,
      percentage,
      results,
      quizTitle: quiz.title,
      resultId
    });

  } catch (error) {
    console.error("❌ Quiz Submission Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const { subject } = req.query;
    
    // Build the aggregation pipeline
    let pipeline = [];
    
    // If subject filter is provided, we need to join with quizzes first
    if (subject && subject !== "all") {
      pipeline = [
        {
          $lookup: {
            from: "createquizzes",
            localField: "quizId",
            foreignField: "_id",
            as: "quizInfo"
          }
        },
        { $unwind: "$quizInfo" },
        {
          $match: { "quizInfo.subject": subject }
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
      ];
    } else {
      // No subject filter - original query
      pipeline = [
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
      ];
    }

    const leaderboard = await QuizSubmission.aggregate(pipeline);

    // Add rank
    const leaderboardWithRank = leaderboard.map((student, index) => ({
      ...student,
      rank: index + 1
    }));

    // Get available subjects from all quizzes
    const subjectsAgg = await QuizSubmission.aggregate([
      {
        $lookup: {
          from: "createquizzes",
          localField: "quizId",
          foreignField: "_id",
          as: "quizInfo"
        }
      },
      { $unwind: "$quizInfo" },
      {
        $group: {
          _id: "$quizInfo.subject"
        }
      },
      {
        $match: { _id: { $ne: null, $ne: "" } }
      }
    ]);
    
    const subjects = subjectsAgg.map(s => s._id).filter(s => s);

    res.json({
      success: true,
      leaderboard: leaderboardWithRank,
      subjects
    });

  } catch (error) {
    console.error("❌ Leaderboard Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const getQuizResult = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("📊 Fetching quiz result with ID:", id);

    const result = await QuizResultDetail.findById(id);
    
    if (!result) {
      return res.status(404).json({ success: false, message: "Quiz result not found" });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("❌ Get Quiz Result Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get all quiz results for a specific student
export const getStudentQuizResults = async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log("📊 Fetching all quiz results for student:", studentId);

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, message: "Invalid student ID" });
    }

    const results = await QuizResultDetail.find({ studentId })
      .populate({
        path: 'quizId',
        select: 'teacherId',
        populate: {
          path: 'teacherId',
          select: 'firstName lastName profilePicture'
        }
      })
      .sort({ createdAt: -1 })
      .select('_id quizId quizTitle score totalQuestions percentage createdAt');

    // Transform results to include teacher info at top level
    const transformedResults = results.map(result => {
      const resultObj = result.toObject();
      if (resultObj.quizId && resultObj.quizId.teacherId) {
        resultObj.teacher = resultObj.quizId.teacherId;
      }
      return resultObj;
    });

    res.json({
      success: true,
      results: transformedResults
    });

  } catch (error) {
    console.error("❌ Get Student Quiz Results Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get student profile by ID
export const getStudentProfile = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, message: "Invalid student ID" });
    }

    const student = await Student.findById(studentId).select('-password');
    
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.json({
      success: true,
      student
    });

  } catch (error) {
    console.error("❌ Get Student Profile Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Update student profile
export const updateStudentProfile = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { firstName, lastName, username, email, profilePhoto } = req.body;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, message: "Invalid student ID" });
    }

    // Check if username or email is already taken by another user
    const existingUser = await Student.findOne({
      $or: [{ email }, { username }],
      _id: { $ne: studentId }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email or Username already taken" });
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      { firstName, lastName, username, email, profilePhoto },
      { new: true }
    ).select('-password');

    if (!updatedStudent) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      student: updatedStudent
    });

  } catch (error) {
    console.error("❌ Update Student Profile Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
