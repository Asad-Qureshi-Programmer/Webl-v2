import { getAuth } from '@clerk/express';
import * as userService from '../services/userService.js';

export const syncUser = async (req, res) => {
  try {
    const auth = getAuth(req);
    const clerkId = auth?.userId;

    if (!clerkId) {
      return res.status(401).json({ message: 'Unauthorized: Missing Clerk auth context' });
    }

    const { email } = req.body;
    const { user, isNew } = await userService.syncClerkUserWithDb(clerkId, email);

    res.status(isNew ? 201 : 200).json({
      message: isNew ? 'User record created in MongoDB' : 'User record already exists',
      user,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error syncing user record', error: error.message });
  }
};