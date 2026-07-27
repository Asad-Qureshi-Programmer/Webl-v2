import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import projectRoutes from './routes/projectRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));



// Add this right after express.json() in index.js
app.use((req, res, next) => {
  console.log(`📡 Incoming Request: ${req.method} ${req.originalUrl}`);
  next();
});

app.use(clerkMiddleware());

// Mount secure API routes
app.use('/api/projects', projectRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: "WebL Backend Running" });
});

app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

// 🚀 ASYNC SERVER BOOTSTRAP FUNCTION
const startServer = async () => {
  try {
    // 1. First, establish connection to MongoDB
    await connectDB();
    
    // 2. Only start HTTP server once DB connection is 100% active!
    app.listen(port, () => {
      console.log(`🚀 Backend running on port ${port}`);
    });
  } catch (error) {
    console.error(`❌ Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();