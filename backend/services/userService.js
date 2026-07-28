import User from '../models/User.js';

export const syncClerkUserWithDb = async (clerkId, email) => {
  let user = await User.findOne({ clerkId });

  if (!user) {
    user = await User.create({
      clerkId,
      email: email || 'user@webl.app',
    });
    return { user, isNew: true };
  }

  return { user, isNew: false };
};