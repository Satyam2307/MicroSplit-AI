import assert from 'node:assert/strict';
import test from 'node:test';
import {
  authorizationFailureStatus,
  canReviewExtractedContribution,
} from '../src/lib/authorization-policy.ts';

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

test('only non-self owners and approvers can correct or review pending extraction proposals', () => {
  const review = {
    actorId: 'approver-1',
    uploaderId: 'uploader-1',
    assignedMemberId: 'contributor-1',
    status: 'pending',
  };
  assert.equal(canReviewExtractedContribution({ ...review, role: 'owner' }), true);
  assert.equal(canReviewExtractedContribution({ ...review, role: 'approver' }), true);
  assert.equal(
    canReviewExtractedContribution({
      ...review,
      role: 'approver',
      assignedMemberId: null,
    }),
    true
  );
  assert.equal(canReviewExtractedContribution({ ...review, role: 'contributor' }), false);
  assert.equal(
    canReviewExtractedContribution({ ...review, role: 'approver', actorId: 'uploader-1' }),
    false
  );
  assert.equal(
    canReviewExtractedContribution({
      ...review,
      role: 'approver',
      actorId: 'contributor-1',
    }),
    false
  );
  assert.equal(
    canReviewExtractedContribution({ ...review, role: 'approver', status: 'confirmed' }),
    false
  );
});

test('a non-self authorized reviewer may correct an unresolved proposal before confirming it', () => {
  const proposal = {
    actorId: 'approver-1',
    uploaderId: 'uploader-1',
    assignedMemberId: null,
    status: 'pending',
  };
  assert.equal(
    canReviewExtractedContribution({ ...proposal, role: 'approver' }),
    true
  );
  assert.equal(
    canReviewExtractedContribution({
      ...proposal,
      role: 'contributor',
    }),
    false
  );
  assert.equal(
    canReviewExtractedContribution({
      ...proposal,
      role: 'approver',
      actorId: 'uploader-1',
    }),
    false
  );
});
