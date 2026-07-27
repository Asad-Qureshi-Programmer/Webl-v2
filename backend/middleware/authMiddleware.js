// // middleware/authMiddleware.js
// import { getAuth } from '@clerk/express';
// import User from '../models/User.js';

// export const protect = async (req, res, next) => {
//   try {
//     const auth = getAuth(req);
//     const clerkId = auth?.userId;

//     if (!clerkId) {
//       return res.status(401).json({ 
//         message: 'Unauthorized: Missing or invalid Clerk Bearer token' 
//       });
//     }

//     // Find or create MongoDB user
//     let user = await User.findOne({ clerkId });
//     if (!user) {
//       console.log(`👤 New Clerk User (${clerkId}). Creating MongoDB record...`);
//       user = await User.create({
//         clerkId,
//         email: auth.claims?.email || `${clerkId}@clerk.user`,
//         name: auth.claims?.name || 'Developer',
//       });
//     }

//     req.user = user;
//     next();
//   } catch (error) {
//     console.error('❌ Auth Middleware Error:', error);
//     res.status(401).json({ message: 'Authentication failed', error: error.message });
//   }
// };






// middleware/authMiddleware.js (Temporary Postman Bypass)
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let user = await User.findOne({ clerkId: 'dev_local_user' });
    if (!user) {
      user = await User.create({
        clerkId: 'dev_local_user',
        email: 'dev@webl.local',
        name: 'Local Developer',
      });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};