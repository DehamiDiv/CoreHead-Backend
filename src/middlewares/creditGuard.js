const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const creditGuard = async (req, res, next) => {
    try {
        // 1. Ensure user is authenticated (req.user is set by authMiddleware)
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'Unauthorized. Please login first.' });
        }

        // 2. Fetch user's subscription and credit details from DB
        let user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found in system.' });
        }

        // 3. PRO subscription bypass
        if (user.subscription_status === 'PRO') {
            return next();
        }

        // 4. Cooldown time-based reset check
        const COOLDOWN_MS = process.env.AI_COOLDOWN_MS
            ? parseInt(process.env.AI_COOLDOWN_MS)
            : 24 * 60 * 60 * 1000; // default 24 hours

        const now = new Date();
        const lastReset = user.last_credits_reset ? new Date(user.last_credits_reset) : new Date(user.createdAt);
        // Safeguard against DB timezone offset differences
        const timeDiff = Math.max(0, now.getTime() - lastReset.getTime());

        if (timeDiff >= COOLDOWN_MS) {
            // Cooldown period has expired! Reset user's credits used to 0
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    ai_credits_used: 0,
                    last_credits_reset: now
                }
            });
            console.log(`[AI-CREDITS] Cooldown expired. Reset credits used to 0 for user: ${user.email}`);
        }

        // 5. Free user credit limit verification
        const creditsLeft = user.ai_credits - user.ai_credits_used;
        if (creditsLeft <= 0) {
            const msRemaining = COOLDOWN_MS - timeDiff;
            const secondsRemaining = Math.max(0, Math.ceil(msRemaining / 1000));

            return res.status(402).json({
                error: 'LIMIT_EXCEEDED',
                message: 'You have exceeded your Free tier AI limit (5 generations). Please upgrade to PRO plan for unlimited access.',
                cooldown_remaining: secondsRemaining,
                credits: {
                    total: user.ai_credits,
                    used: user.ai_credits_used,
                    remaining: 0
                }
            });
        }

        // Carry user data forward if needed
        req.dbUser = user;
        next();
    } catch (error) {
        console.error('Credit verification guard error:', error);
        res.status(500).json({ error: 'Internal validation error during credit checks.' });
    }
};

module.exports = creditGuard;
