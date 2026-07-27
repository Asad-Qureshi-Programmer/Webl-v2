// services/projectService.js
import Project from '../models/Project.js';
import { testResponse } from '../utils/testResponse.js';
import sendGeminiRequest, { sendWorkspaceUpdateRequest } from './geminiRequest.js';

/**
 * Helper: Unrolls DB fileSystem into a plain key-value map ONLY when
 * passing code context to Gemini for incremental prompts.
 */
const unwrapFileSystemForContext = (rawFS) => {
  if (!rawFS) return {};
  
  let data = rawFS;

  // Handles nested webfiles string wrappers
  if (data && data.webfiles) {
    try {
      data = typeof data.webfiles === 'string' ? JSON.parse(data.webfiles) : data.webfiles;
    } catch (e) {
      console.error('[WebL Engine] Failed parsing webfiles wrapper:', e);
      return {};
    }
  }

  // Extracts inner fileSystem or fallback
  const fsObj = data?.fileSystem || data;

  if (typeof fsObj === 'string') {
    try {
      return JSON.parse(fsObj);
    } catch (e) {
      return {};
    }
  }

  return typeof fsObj === 'object' && fsObj !== null ? fsObj : {};
};

export const fetchUserProjects = async (userId) => {
  return await Project.find({ owner: userId })
    .select('title description hasGenerated createdAt updatedAt')
    .sort({ updatedAt: -1 });
};

export const createNewProject = async (userId, title, description, fileSystem) => {
  // Pass incoming payload or fallback testResponse as-is
  const finalFileSystem = fileSystem || testResponse;

  return await Project.create({
    title: title || 'Untitled Project',
    description: description || '',
    owner: userId,
    fileSystem: finalFileSystem,
    hasGenerated: false,
  });
};

export const fetchProjectById = async (projectId, userId) => {
  const project = await Project.findOne({ _id: projectId, owner: userId });
  if (!project) throw new Error('PROJECT_NOT_FOUND');
  return project;
};

export const saveFileSystemUpdate = async (projectId, userId, fileSystem) => {
  const project = await Project.findOneAndUpdate(
    { _id: projectId, owner: userId },
    { $set: { fileSystem, updatedAt: Date.now() } },
    { new: true }
  );
  if (!project) throw new Error('PROJECT_NOT_FOUND');
  return project;
};

export const removeProject = async (projectId, userId) => {
  const project = await Project.findOneAndDelete({ _id: projectId, owner: userId });
  if (!project) throw new Error('PROJECT_NOT_FOUND');
  return project;
};

export const processAIGeneration = async (projectId, userId, userPromptString) => {
  const project = await Project.findOne({ _id: projectId, owner: userId });
  if (!project) throw new Error('PROJECT_NOT_FOUND');

  let newAiPayload;

  if (project.hasGenerated) {
    // ⚡ INCREMENTAL PATCH OPERATION
    const currentFileSystem = unwrapFileSystemForContext(project.fileSystem);

    const fileTreeSummary = Object.keys(currentFileSystem);
    const targetedFilesContent = Object.entries(currentFileSystem)
      .filter(([path]) => path.endsWith('.jsx') || path.endsWith('.css') || path.includes('App') || path.includes('Home'))
      .map(([path, content]) => `--- FILE: ${path} ---\n${content}`)
      .join('\n');

    const aiPatchText = await sendWorkspaceUpdateRequest(fileTreeSummary, targetedFilesContent, userPromptString);
    newAiPayload = typeof aiPatchText === 'string' ? { webfiles: aiPatchText } : aiPatchText;
  } else {
    // ✨ FOUNDATIONAL GENERATION OPERATION
    const aiResponse = await sendGeminiRequest(userPromptString);
    newAiPayload = typeof aiResponse === 'string' ? { webfiles: aiResponse } : aiResponse;
    project.hasGenerated = true;
  }

  project.fileSystem = newAiPayload;
  project.promptHistory.push({ prompt: userPromptString });
  await project.save();

  return project;
};