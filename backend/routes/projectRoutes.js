import express from 'express';
import {
  getUserProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  generateAIWorkspace,
} from '../controllers/projectController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getUserProjects)
  .post(createProject);

router.route('/:id')
  .get(getProjectById)
  .put(updateProject)
  .delete(deleteProject);

router.post('/:id/generate', generateAIWorkspace);

export default router;