const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authMiddleware = require('../middlewares/authMiddleware');

const stripeSecret = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key';
const stripe = require('stripe')(stripeSecret);

// ─── POST /api/payment/checkout-session ───────────────────────
// Creates a checkout session or simulates mock activation
router.post('/checkout-session', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // 2. Real Stripe session checkout flow
        console.log(`[Billing] Creating Stripe Checkout Session for User ID: ${userId}`);
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'CoreHead PRO Membership',
                            description: 'Unlock unlimited AI Layout Building, Grammar Polishers, and templates.',
                        },
                        unit_amount: 999, // $9.99
                        recurring: {
                            interval: 'month',
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/cancel`,
            client_reference_id: userId.toString(),
            metadata: {
                userId: userId.toString(),
            },
        });

        return res.json({ success: true, url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        return res.status(500).json({ error: 'Failed to initialize payment gateway checkout: ' + error.message });
    }
});

// ─── POST /api/payment/webhook ────────────────────────────────
// Webhook listening to Stripe hooks on payment complete
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (webhookSecret && sig) {
            // Secure signature validation
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } else {
            // Parsing fallback when testing without webhook verification secrets
            event = req.body;
        }
    } catch (err) {
        console.error(`Webhook signature verification failed:`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle billing payment successful events
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userIdStr = session.client_reference_id || session.metadata?.userId;

        if (userIdStr) {
            const userId = parseInt(userIdStr);
            console.log(`[Billing Upgrade] Stripe payment success detected. Upgrading User ID: ${userId} to PRO.`);

            try {
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        subscription_status: 'PRO',
                        ai_credits_used: 0 // Reset credits count
                    }
                });
            } catch (dbErr) {
                console.error('Failed to update user payment status on database:', dbErr.message);
            }
        }
    }

    res.json({ received: true });
});

module.exports = router;
