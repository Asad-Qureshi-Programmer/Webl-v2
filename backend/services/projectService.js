// services/projectService.js
import Project from '../models/Project.js';
import sendGeminiRequest, { sendWorkspaceUpdateRequest } from './geminiRequest.js';
import { testResponse } from '../utils/testResponse.js'; // Heavy multi-page demo
import { blankTemplate } from '../utils/blankTemplate.js';

/**
 * Helper: Unrolls DB fileSystem into a plain key-value map ONLY when
 * passing code context to Gemini for incremental prompts.
 */
const unwrapFileSystemForContext = (rawFS) => {
  if (!rawFS) return {};

  let current = rawFS;

  // Keep parsing as long as it's a string
  while (typeof current === 'string') {
    try {
      current = JSON.parse(current);
    } catch (e) {
      break;
    }
  }

  // Unwrap webfiles container
  if (current && typeof current === 'object' && current.webfiles) {
    return unwrapFileSystemForContext(current.webfiles);
  }

  // Unwrap fileSystem container
  if (current && typeof current === 'object' && current.fileSystem) {
    return unwrapFileSystemForContext(current.fileSystem);
  }

  return typeof current === 'object' && current !== null ? current : {};
};

export const fetchUserProjects = async (userId) => {
  let projects = await Project.find({ owner: userId })
    .select('title description hasGenerated createdAt updatedAt')
    .sort({ updatedAt: -1 });

  // 🚀 Auto-seed the 1 default Demo Project if user has zero projects
  if (projects.length === 0) {
    const demoProject = await Project.create({
      title: 'Demo Nexus Store',
      description: 'Pre-built sample project template to explore WebL Studio features.',
      owner: userId,
      fileSystem: testResponse,
      hasGenerated: true, // Nexus Demo starts in Update/Patch mode
    });

    projects = [demoProject];
  }

  return projects;
};

export const createNewProject = async (userId, title, description, fileSystem) => {
  // 🚀 User-created projects default to the minimal blankTemplate
  const finalFileSystem = fileSystem || blankTemplate;

  return await Project.create({
    title: title || 'Untitled Project',
    description: description || '',
    owner: userId,
    fileSystem: finalFileSystem,
    hasGenerated: false, // User projects start in Build mode
  });
};

export const fetchProjectById = async (projectId, userId) => {
  const project = await Project.findOne({ _id: projectId, owner: userId });
  if (!project) throw new Error('PROJECT_NOT_FOUND');
  return project;
};


export const saveFileSystemUpdate = async (projectId, userId, incomingFS) => {
  // 1. Fully unwrap incoming data in case it's already clean or partially wrapped
  const cleanFilesObject = unwrapFileSystemForContext(incomingFS);

  // 2. Wrap it into the exact stringified structure your frontend expects
  const formattedForDB = {
    webfiles: JSON.stringify({ fileSystem: cleanFilesObject })
  };

  // 3. Save to MongoDB
  const project = await Project.findOneAndUpdate(
    { _id: projectId, owner: userId },
    { $set: { fileSystem: formattedForDB, updatedAt: Date.now() } },
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

// services/projectService.js

export const processAIGeneration = async (projectId, userId, userPromptString) => {
  const project = await Project.findOne({ _id: projectId, owner: userId });
  if (!project) throw new Error('PROJECT_NOT_FOUND');

  // 1. Get the current full workspace file map from the DB
  const currentFS = unwrapFileSystemForContext(project.fileSystem);

  if (project.hasGenerated) {
    // ⚡ INCREMENTAL PATCH OPERATION
    const fileTreeSummary = Object.keys(currentFS);
    
    const targetedFilesContent = Object.entries(currentFS)
      .filter(([path]) => path.endsWith('.jsx') || path.endsWith('.css') || path.includes('App') || path.includes('Home'))
      .map(([path, content]) => `--- FILE: ${path} ---\n${content}`)
      .join('\n');

    const aiPatchText = await sendWorkspaceUpdateRequest(fileTreeSummary, targetedFilesContent, userPromptString);
    
    // Parse Gemini's response
    const patchData = unwrapFileSystemForContext(aiPatchText);

    // 🚀 START WITH A COPY OF ALL EXISTING FILES (Guarantees Home, Navbar, Footer aren't lost)
    const mergedFileSystem = { ...currentFS };

    // Look for explicit updatedFiles property or flat file entries
    const incomingFiles = patchData.updatedFiles || patchData.fileSystem || patchData;

    if (incomingFiles && typeof incomingFiles === 'object') {
      Object.entries(incomingFiles).forEach(([filePath, code]) => {
        if (filePath !== 'newFiles' && filePath !== 'webfiles' && filePath !== 'updatedFiles' && filePath !== 'fileSystem') {
          mergedFileSystem[filePath] = typeof code === 'string' ? code : JSON.stringify(code);
        }
      });
    }

    // Handle new files if any
    const newFilesList = patchData.newFiles || [];
    if (Array.isArray(newFilesList)) {
      newFilesList.forEach((file) => {
        if (file.path && file.content) {
          mergedFileSystem[file.path] = typeof file.content === 'string' ? file.content : JSON.stringify(file.content);
        }
      });
    }

    // Save the fully merged file system back to DB
    project.fileSystem = {
      webfiles: JSON.stringify({ fileSystem: mergedFileSystem })
    };

  } else {
    // ✨ FOUNDATIONAL GENERATION OPERATION (First prompt)
    const aiResponse = await sendGeminiRequest(userPromptString);
    project.fileSystem = typeof aiResponse === 'string' ? { webfiles: aiResponse } : aiResponse;
    project.hasGenerated = true;
  }

  project.promptHistory.push({ prompt: userPromptString });
  await project.save();

  return project;
};