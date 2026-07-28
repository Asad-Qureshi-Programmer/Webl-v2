// routes/webhookRoutes.js
import express from 'express';
import { Webhook } from 'svix';
import User from '../models/User.js';

const router = express.Router();

router.post('/clerk', express.raw({ type: 'application/json' }), async (req, res) => {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!SIGNING_SECRET) {
    return res.status(500).json({ message: 'Missing CLERK_WEBHOOK_SECRET' });
  }

  const payload = req.body;
  const headers = req.headers;

  const wh = new Webhook(SIGNING_SECRET);
  let evt;

  try {
    evt = wh.verify(payload, headers);
  } catch (err) {
    return res.status(400).json({ message: 'Webhook verification failed' });
  }

  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const primaryEmail = email_addresses?.[0]?.email_address;
    const fullName = `${first_name || ''} ${last_name || ''}`.trim() || 'Developer';

    await User.create({
      clerkId: id,
      email: primaryEmail,
      name: fullName,
    });
    console.log(`✅ Clerk Webhook: User synced (${id})`);
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;
    await User.deleteOne({ clerkId: id });
    console.log(`🗑️ Clerk Webhook: User deleted (${id})`);
  }

  res.status(200).json({ success: true });
});

export default router;