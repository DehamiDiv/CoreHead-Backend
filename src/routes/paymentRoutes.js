const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authMiddleware = require('../middlewares/authMiddleware');

const md5 = (value) =>
    crypto.createHash('md5').update(value).digest('hex').toUpperCase();

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
                    subscription_status: planType,
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
            const planType = session.metadata?.planType || 'PRO';
            console.log(`[Billing Upgrade] Stripe payment success detected. Upgrading User ID: ${userId} to ${planType}.`);

            try {
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        subscription_status: planType,
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

// ─── POST /api/payment/payhere/checkout ───────────────────────
// Pre-calculates dynamic validation token parameters and stores pending state
router.post('/payhere/checkout', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { planType = 'PRO' } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const merchantId = process.env.PAYHERE_MERCHANT_ID || '1234567';
        const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET || 'YOUR_SECRET';

        const orderId = 'ORDER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

        // Price configuration
        const isEnterprise = planType === 'ENTERPRISE';
        const amount = isEnterprise ? 16600 : 3400;
        const formattedAmount = Number(amount).toFixed(2);
        const currency = 'LKR';

        // Signature hashing
        const hashedSecret = md5(merchantSecret);
        const hash = md5(
            merchantId +
            orderId +
            formattedAmount +
            currency +
            hashedSecret
        );





        // Save pending payment record to PostgreSQL via Prisma
        await prisma.payment.create({
            data: {
                userId,
                orderId,
                amount,
                currency,
                status: 'pending'
            }
        });

        const notifyUrl = process.env.PAYHERE_NOTIFY_URL || `${process.env.BACKEND_URL || 'https://YOUR-PUBLIC-BACKEND.com'}/api/payment/payhere/notify`;
        const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?gateway=payhere&order_id=${orderId}&plan=${planType}`;
        const cancelUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/cancel?gateway=payhere`;

        return res.json({
            success: true,
            sandbox: true,
            merchant_id: merchantId,
            return_url: returnUrl,
            cancel_url: cancelUrl,
            notify_url: notifyUrl,
            order_id: orderId,
            items: isEnterprise ? 'CoreHead Enterprise Membership' : 'CoreHead PRO Membership',
            amount: formattedAmount,
            currency,
            hash,
            first_name: user.name || 'CoreHead',
            last_name: 'Member',
            email: user.email,
            phone: '0771234567',
            address: 'Colombo',
            city: 'Colombo',
            country: 'Sri Lanka'
        });
    } catch (error) {
        console.error('Error creating PayHere checkout parameters:', error);
        return res.status(500).json({ error: 'Failed to create payment verification session: ' + error.message });
    }
});

// ─── POST /api/payment/payhere/notify ─────────────────────────
// Webhook for PayHere server notifications (Public)
router.post('/payhere/notify', async (req, res) => {
    try {
        const {
            merchant_id,
            order_id,
            payment_id,
            payhere_amount,
            payhere_currency,
            status_code,
            md5sig
        } = req.body;

        const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET || 'YOUR_SECRET';
        const hashedSecret = md5(merchantSecret);

        // Verification token signature
        const localMd5Sig = md5(
            merchant_id +
            order_id +
            payhere_amount +
            payhere_currency +
            status_code +
            hashedSecret
        );

        if (localMd5Sig !== md5sig) {
            console.warn('[PayHere Webhook] Invalid request hash signature.');
            return res.status(400).send('Invalid signature');
        }

        // Search for existing payment record
        const payment = await prisma.payment.findUnique({
            where: { orderId: order_id }
        });

        if (!payment) {
            console.warn(`[PayHere Webhook] Payment matching order ID ${order_id} not found.`);
            return res.status(404).send('Payment not found');
        }

        // Update payment status (status_code 2 = success)
        let finalStatus = 'pending';
        if (status_code === '2') {
            finalStatus = 'paid';
        } else if (status_code === '-1') {
            finalStatus = 'cancelled';
        } else if (status_code === '-2' || status_code === '-3') {
            finalStatus = 'failed';
        }

        const updatedPayment = await prisma.payment.update({
            where: { orderId: order_id },
            data: {
                status: finalStatus,
                paymentId: payment_id
            }
        });

        // Upgrade user status if payload represents successful purchase check
        if (finalStatus === 'paid') {
            const upgradedPlan = parseFloat(payhere_amount) > 10000 ? 'ENTERPRISE' : 'PRO';
            await prisma.user.update({
                where: { id: updatedPayment.userId },
                data: {
                    subscription_status: upgradedPlan,
                    ai_credits_used: 0
                }
            });
            console.log(`[PayHere Upgrade] User ID ${updatedPayment.userId} upgraded to ${upgradedPlan}. order_id: ${order_id}`);
        }

        return res.status(200).send('OK');
    } catch (error) {
        console.error('Error handling PayHere payment webhook:', error);
        return res.status(500).send('Webhook server error');
    }
});

module.exports = router;
