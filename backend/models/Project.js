// models/Project.js
import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'Untitled Project',
    },
    description: {
      type: String,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Stores the file structure map: { "package.json": "...", "src/App.jsx": "..." }
    fileSystem: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    // Keeps track of whether initial AI generation ran
    hasGenerated: {
      type: Boolean,
      default: false,
    },
    // Stores prompt history for iterative patches
    promptHistory: [
      {
        prompt: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Project = mongoose.model('Project', projectSchema);
export default Project;