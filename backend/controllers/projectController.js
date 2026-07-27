// controllers/projectController.js
import * as projectService from '../services/projectService.js';

export const getUserProjects = async (req, res) => {
  try {
    const projects = await projectService.fetchUserProjects(req.user._id);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching projects', error: error.message });
  }
};

export const createProject = async (req, res) => {
  try {
    const { title, description, fileSystem } = req.body;
    const project = await projectService.createNewProject(req.user._id, title, description, fileSystem);
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Error creating project', error: error.message });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const project = await projectService.fetchProjectById(req.params.id, req.user._id);
    res.json(project);
  } catch (error) {
    const status = error.message === 'PROJECT_NOT_FOUND' ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { fileSystem } = req.body;
    const project = await projectService.saveFileSystemUpdate(req.params.id, req.user._id, fileSystem);
    res.json(project);
  } catch (error) {
    const status = error.message === 'PROJECT_NOT_FOUND' ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    await projectService.removeProject(req.params.id, req.user._id);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    const status = error.message === 'PROJECT_NOT_FOUND' ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const generateAIWorkspace = async (req, res) => {
  try {
    let userPromptString = "";
    if (req.body && typeof req.body.prompt === 'object' && req.body.prompt !== null) {
      userPromptString = req.body.prompt.prompt || "";
    } else if (req.body && typeof req.body.prompt === 'string') {
      userPromptString = req.body.prompt;
    } else {
      userPromptString = "Create a professional business landing page";
    }

    const project = await projectService.processAIGeneration(req.params.id, req.user._id, userPromptString);
    res.json(project);
  } catch (error) {
    const status = error.message === 'PROJECT_NOT_FOUND' ? 404 : 500;
    res.status(status).json({ message: 'AI Generation failed', error: error.message });
  }
};