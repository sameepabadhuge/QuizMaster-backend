import express from "express";
import { createQuiz, getAllQuizzes, getQuizById, deleteQuiz, updateQuiz, getTeacherQuizzes } from "../controllers/createQuiz.controller.js";

const router = express.Router();

// Teacher creates quiz
router.post("/", createQuiz);

// Student fetch all quizzes
router.get("/", getAllQuizzes);

// Get teacher's own quizzes
router.get("/teacher/:teacherId", getTeacherQuizzes);

// Get quiz by ID
router.get("/quiz/:id", getQuizById);

// Update quiz
router.put("/:id", updateQuiz);

// Delete quiz
router.delete("/:id", deleteQuiz);

export default router;
