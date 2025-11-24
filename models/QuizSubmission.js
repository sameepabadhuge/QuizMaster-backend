import mongoose from "mongoose";

const quizSubmissionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: "CreateQuiz", required: true },
  quizTitle: { type: String },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  percentage: { type: Number, required: true },
  submittedAt: { type: Date, default: Date.now },
});

export default mongoose.model("QuizSubmission", quizSubmissionSchema);
