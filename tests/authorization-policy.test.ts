import assert from 'node:assert/strict';
import test from 'node:test';
import { authorizationFailureStatus } from '../src/lib/authorization-policy.ts';

test('unauthenticated requests are denied with 401', () => {
  assert.equal(authorizationFailureStatus(null), 401);
});

test('authenticated users without squad membership are denied with 403', () => {
  assert.equal(authorizationFailureStatus('user-1'), 403);
});

test('members without the required role are denied', () => {
  assert.equal(
    authorizationFailureStatus('user-1', 'contributor', ['owner', 'approver']),
    403
  );
});

test('members with an allowed squad role may continue', () => {
  assert.equal(
    authorizationFailureStatus('user-1', 'approver', ['owner', 'approver']),
    null
  );
});
