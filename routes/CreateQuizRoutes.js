import express from "express";
import { createQuiz, getAllQuizzes, getQuizById, deleteQuiz } from "../controllers/createQuiz.controller.js";

const router = express.Router();

// Teacher creates quiz
router.post("/", createQuiz);

// Student fetch quizzes
router.get("/", getAllQuizzes);

// Get quiz by ID
router.get("/:id", getQuizById);

// Delete quiz (optional)
router.delete("/:id", deleteQuiz);

export default router;
