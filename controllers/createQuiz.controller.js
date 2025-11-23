import CreateQuiz from "../models/CreateQuiz.js";

// ✅ Teacher Creates a Quiz
export const createQuiz = async (req, res) => {
  try {
    const { title, description, teacherId, questions, lectureName, subject, duration, difficulty } = req.body;

    if (!title || !teacherId || !questions) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const quiz = await CreateQuiz.create({
      title,
      description,
      teacherId,
      lectureName,
      subject,
      duration,
      difficulty,
      questions,
    });

    res.status(201).json({ success: true, quiz });
  } catch (err) {
    console.error("Error creating quiz:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Get All Quizzes
export const getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await CreateQuiz.find().sort({ createdAt: -1 });
    res.json({ success: true, quizzes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Get Quiz by ID
export const getQuizById = async (req, res) => {
  try {
    const quiz = await CreateQuiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });
    res.json(quiz);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🗑️ Optional: Delete quiz
export const deleteQuiz = async (req, res) => {
  try {
    await CreateQuiz.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Quiz deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

