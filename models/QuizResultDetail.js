import mongoose from "mongoose";

const quizResultSchema = new mongoose.Schema({
  quizTitle: { type: String, required: true },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  percentage: { type: Number, required: true },
  results: [
    {
      question: String,
      userAnswer: String,
      correctAnswer: String,
      isCorrect: Boolean,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("QuizResultDetail", quizResultSchema);
