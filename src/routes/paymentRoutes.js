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
        const { mock, planType = 'PRO' } = req.body;

        const isEnterprise = planType === 'ENTERPRISE';
        const priceAmount = isEnterprise ? 4900 : 999;
        const productName = isEnterprise ? 'CoreHead ENTERPRISE Membership' : 'CoreHead PRO Membership';
        const productDesc = isEnterprise
            ? 'Unlock unlimited AI Layout Building, custom editors, priority support, and multi-tenant hosting.'
            : 'Unlock unlimited AI Layout Building, Grammar Polishers, and templates.';

        // If mock is requested, or Stripe keys are absent/placeholder, use Mock Activation Flow
        const hasStripe = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_placeholder_key';

        if (mock || !hasStripe) {
            console.log(`[Billing Sandbox] Simulating payment success for User ID: ${userId} (${planType})`);

            // Instantly upgrade user in DB as a bypass
            await prisma.user.update({
                where: { id: userId },
                data: {
                    subscription_status: 'PRO',
                    ai_credits_used: 0
                }
            });

            return res.json({
                success: true,
                url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?mock=true&plan=${planType}`
            });
        }

        // Real Stripe session checkout flow
        console.log(`[Billing] Creating Stripe Checkout Session for User ID: ${userId} (${planType})`);
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: productName,
                            description: productDesc,
                        },
                        unit_amount: priceAmount,
                        recurring: {
                            interval: 'month',
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?session_id={CHECKOUT_SESSION_ID}&plan=${planType}`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/cancel`,
            client_reference_id: userId.toString(),
            metadata: {
                userId: userId.toString(),
                planType
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

// POST /api/payment/demo-request
// Stores enterprise demo lead inquiry in database
router.post('/demo-request', async (req, res) => {
    try {
        const { name, email, company, message } = req.body;
        console.log(`[Enterprise Demo Request] New signup submission:`);
        console.log(` - Name: ${name}`);
        console.log(` - Email: ${email}`);
        console.log(` - Company: ${company}`);
        console.log(` - Message: ${message}`);

        await prisma.demoRequest.create({
            data: {
                name,
                email,
                company,
                message
            }
        });

        return res.json({ success: true, message: 'Request registered successfully.' });
    } catch (error) {
        console.error('Error creating demo request:', error);
        return res.status(500).json({ error: 'Failed to record demo request: ' + error.message });
    }
});

module.exports = router;
