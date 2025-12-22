import express from "express";
import { registerStudent, loginStudent, submitQuiz, getLeaderboard, getQuizResult, getStudentQuizResults, getStudentProfile, updateStudentProfile, changeStudentPassword } from "../controllers/studentController.js";
const router = express.Router();

router.post("/register", registerStudent);
router.post("/login", loginStudent);
router.post("/submit-quiz", submitQuiz);
router.get("/leaderboard", getLeaderboard);
router.get("/quiz-result/:id", getQuizResult);
router.get("/student-results/:studentId", getStudentQuizResults);
router.get("/profile/:studentId", getStudentProfile);
router.put("/profile/:studentId", updateStudentProfile);
router.put("/change-password/:studentId", changeStudentPassword);
router.put("/change-password", changeStudentPassword);

export default router;
