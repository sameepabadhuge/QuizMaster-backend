import CreateQuiz from "../models/CreateQuiz.js";

// ✅ Teacher Creates a Quiz
export const createQuiz = async (req, res) => {
  try {
    console.log("📨 Received payload:", req.body);
    
    const { title, description, teacherId, questions, lectureName, subject, duration, difficulty } = req.body;

    console.log("Title:", title, "| TeacherId:", teacherId, "| Questions:", questions?.length);

    if (!title || !teacherId || !questions) {
      console.log("❌ Validation error - Missing fields");
      return res.status(400).json({ success: false, message: "Missing required fields: title, teacherId, and questions are required" });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      console.log("❌ Validation error - Questions not array or empty");
      return res.status(400).json({ success: false, message: "Questions must be a non-empty array" });
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

    res.status(201).json({ success: true, message: "Quiz created successfully", quiz });
  } catch (err) {
    console.error("Error creating quiz:", err.message);
    console.error("Full error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ✅ Get All Quizzes
export const getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await CreateQuiz.find()
      .populate('teacherId', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 });
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

// 🗑️ Delete quiz
export const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacherId } = req.body;

    const quiz = await CreateQuiz.findById(id);
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });

    // Check if teacher owns the quiz
    if (quiz.teacherId.toString() !== teacherId) {
      return res.status(403).json({ success: false, message: "Unauthorized: You can only delete your own quizzes" });
    }

    await CreateQuiz.findByIdAndDelete(id);
    res.json({ success: true, message: "Quiz deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Edit Quiz
export const updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacherId, title, description, questions, lectureName, subject, duration, difficulty } = req.body;

    const quiz = await CreateQuiz.findById(id);
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });

    // Check if teacher owns the quiz
    if (quiz.teacherId.toString() !== teacherId) {
      return res.status(403).json({ success: false, message: "Unauthorized: You can only edit your own quizzes" });
    }

    // Update quiz
    const updatedQuiz = await CreateQuiz.findByIdAndUpdate(
      id,
      {
        title,
        description,
        lectureName,
        subject,
        duration,
        difficulty,
        questions,
      },
      { new: true }
    );

    res.json({ success: true, message: "Quiz updated successfully", quiz: updatedQuiz });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Get Teacher's Own Quizzes
export const getTeacherQuizzes = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const quizzes = await CreateQuiz.find({ teacherId }).sort({ createdAt: -1 });
    res.json({ success: true, quizzes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

