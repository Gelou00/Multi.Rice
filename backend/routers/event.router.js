import express from 'express';
import { submitData, getLatestSummary } from '../controllers/event.controller.js';
import userAuthentication from '../functions/userAuthentication.js';

const router= express.Router();

router.post("/submit-data", submitData);
router.post("/submit", submitData);
router.get("/temp-summary", getLatestSummary);

export default router;