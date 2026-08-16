const assert = require('node:assert/strict');
const test = require('node:test');

const {
  authorizeUserUpdate,
} = require('../src/controllers/userController');

test('a user can update their own non-privileged profile fields', () => {
  const targetId = authorizeUserUpdate(
    { id: 12, role: 'Editor' },
    '12',
    { name: 'Site Editor', avatar: '/uploads/editor.png', bio: 'Editor bio' },
  );

  assert.equal(targetId, 12);
});

test('a non-admin cannot update another account', () => {
  assert.throws(
    () => authorizeUserUpdate({ id: 12, role: 'Editor' }, 13, { name: 'Other' }),
    (error) => error.statusCode === 403 && /own profile/.test(error.message),
  );
});

test('a non-admin cannot promote their own platform role', () => {
  assert.throws(
    () => authorizeUserUpdate({ id: 12, role: 'Editor' }, 12, { role: 'ADMIN' }),
    (error) => error.statusCode === 403 && /administrator/.test(error.message),
  );
});

test('a platform administrator can manage another account', () => {
  assert.equal(
    authorizeUserUpdate(
      { id: 1, role: 'ADMIN' },
      13,
      { role: 'Editor', status: 'active' },
    ),
    13,
  );
});
