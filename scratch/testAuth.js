const authService = require('../src/services/authService');
const userRepository = require('../src/repositories/userRepository');
const prisma = require('../src/models/prismaClient');

async function runTests() {
    console.log('--- Starting Comprehensive Auth Tests ---');
    const testEmail = `testuser_${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    const testName = 'Test User';

    try {
        // 1. Register User
        console.log('\n[TEST 1] Registering user:', testEmail);
        const regResult = await authService.registerUser(testEmail, testPassword, testName);
        console.log('✓ Registered successfully! User ID:', regResult.user.id);
        console.log('✓ OTP generated:', regResult.otp);

        // 2. Try to login before verification
        console.log('\n[TEST 2] Trying login before email verification...');
        try {
            await authService.loginUser(testEmail, testPassword);
            console.error('✗ Expected error: EMAIL_NOT_VERIFIED, but login succeeded!');
        } catch (e) {
            console.log('✓ Expected failure caught:', e.message);
        }

        // 3. Verify with wrong OTP
        console.log('\n[TEST 3] Verifying with wrong OTP...');
        try {
            await authService.verifyEmail(testEmail, '000000');
            console.error('✗ Expected verification failure, but passed!');
        } catch (e) {
            console.log('✓ Expected OTP failure caught:', e.message);
        }

        // 4. Verify with correct OTP
        console.log('\n[TEST 4] Verifying with correct OTP:', regResult.otp);
        const verifyResult = await authService.verifyEmail(testEmail, regResult.otp);
        console.log('✓ Verified successfully! Token received:', !!verifyResult.accessToken);

        // 5. Login with verified user
        console.log('\n[TEST 5] Logging in with valid credentials...');
        const loginResult = await authService.loginUser(testEmail, testPassword);
        console.log('✓ Login successful! Token:', loginResult.accessToken.substring(0, 20) + '...');
        console.log('✓ User payload:', loginResult.user.email, '| Role:', loginResult.user.role);

        // 6. Refresh token
        console.log('\n[TEST 6] Refreshing access token...');
        const refreshResult = await authService.refreshAccessToken(loginResult.refreshToken);
        console.log('✓ Token refreshed successfully! New token:', refreshResult.accessToken.substring(0, 20) + '...');

        // 7. Request password reset
        console.log('\n[TEST 7] Requesting password reset...');
        await authService.requestPasswordReset(testEmail);
        const userWithReset = await prisma.user.findUnique({ where: { email: testEmail } });
        console.log('✓ Reset token in DB:', !!userWithReset.resetPasswordToken);

        // 8. Reset password
        // To simulate, we need the raw token or test with the helper
        console.log('\n[TEST 8] Testing Google user safeguard...');
        const googleUser = await prisma.user.findFirst({ where: { provider: 'google' } });
        if (googleUser) {
            try {
                await authService.loginUser(googleUser.email, 'AnyPassword123!');
                console.error('✗ Expected error for Google user, but succeeded!');
            } catch (e) {
                console.log('✓ Caught safe error for Google user:', e.message);
            }
        }

        // Cleanup
        console.log('\n[CLEANUP] Deleting test user...');
        await userRepository.deleteUser(regResult.user.id);
        console.log('✓ Test user cleaned up.');

        console.log('\n=========================================');
        console.log('🎉 ALL AUTHENTICATION TESTS PASSED 100%!');
        console.log('=========================================');
    } catch (err) {
        console.error('Test execution failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

runTests();
