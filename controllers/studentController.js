import Student from "../models/Student.js";
import CreateQuiz from "../models/CreateQuiz.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
    
    const { quizId, answers } = req.body;

    if (!quizId || !answers) {
      console.log("❌ Missing quizId or answers");
      return res.status(400).json({ success: false, message: "Quiz ID and answers are required" });
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

    res.json({
      success: true,
      score,
      totalQuestions,
      percentage,
      results,
      quizTitle: quiz.title
    });

  } catch (error) {
    console.error("❌ Quiz Submission Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
