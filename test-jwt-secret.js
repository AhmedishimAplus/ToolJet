require('dotenv').config({ path: '.env' });
const jwt = require('jsonwebtoken');

const secret = process.env.PGRST_JWT_SECRET;
console.log('PGRST_JWT_SECRET from .env:', secret);

if (!secret) {
    console.log('ERROR: PGRST_JWT_SECRET is not defined!');
    process.exit(1);
}

// Create a test token
const payload = { role: 'user_test' };
const token = jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn: '1m',
});

console.log('\nGenerated JWT:');
console.log(token);

// Try to verify it
try {
    const verified = jwt.verify(token, secret);
    console.log('\n✅ Token verified successfully with secret:', secret);
    console.log('Payload:', verified);
} catch (err) {
    console.log('\n❌ Token verification failed:', err.message);
}
