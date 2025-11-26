import express from "express";
import { registerStudent, loginStudent, submitQuiz, getLeaderboard, getQuizResult } from "../controllers/studentController.js";
const router = express.Router();

router.post("/register", registerStudent);
router.post("/login", loginStudent);
router.post("/submit-quiz", submitQuiz);
router.get("/leaderboard", getLeaderboard);
router.get("/quiz-result/:id", getQuizResult);

export default router;
