import express from 'express';
import { checkLoginStatus } from '../controllers/auth.controller.js';

const router = express.Router();

// Route to check login status
router.get('/check-login', checkLoginStatus);

export default router;