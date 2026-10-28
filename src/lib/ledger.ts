// Ledger Engine – Append-only hash chain
// Each event references the hash of the previous event, forming an immutable chain.

import CryptoJS from 'crypto-js';
import type { LedgerEventType } from '@/types';

export interface LedgerEntry {
  id: string;
  type: LedgerEventType;
  refId: string;
  amountMinor: number;
  payloadJson: string;
  prevHash: string | null;
  hash: string;
  createdAt: string;
}

/**
 * Compute hash for a ledger event.
 * hash = SHA-256(type + refId + amountMinor + payloadJson + prevHash + createdAt)
 */
export function computeLedgerHash(
  type: string,
  refId: string,
  amountMinor: number,
  payloadJson: string,
  prevHash: string | null,
  createdAt: string
): string {
  const input = `${type}|${refId}|${amountMinor}|${payloadJson}|${prevHash ?? 'GENESIS'}|${createdAt}`;
  return CryptoJS.SHA256(input).toString();
}

/**
 * Verify the entire ledger chain.
 * Returns { valid, totalEvents, brokenAt? }
 */
export function verifyLedgerChain(events: LedgerEntry[]): {
  valid: boolean;
  totalEvents: number;
  brokenAt?: number;
} {
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    
    // Verify hash
    const expectedHash = computeLedgerHash(
      event.type,
      event.refId,
      event.amountMinor,
      event.payloadJson,
      event.prevHash,
      event.createdAt
    );
    
    if (event.hash !== expectedHash) {
      return { valid: false, totalEvents: events.length, brokenAt: i };
    }
    
    // Verify chain link (except for first event)
    if (i > 0 && event.prevHash !== events[i - 1].hash) {
      return { valid: false, totalEvents: events.length, brokenAt: i };
    }
    
    // First event should have null prevHash
    if (i === 0 && event.prevHash !== null) {
      return { valid: false, totalEvents: events.length, brokenAt: 0 };
    }
  }

  return { valid: true, totalEvents: events.length };
}

/**
 * Create a new ledger entry, chaining it to the previous one.
 */
export function createLedgerEntry(
  id: string,
  type: LedgerEventType,
  refId: string,
  amountMinor: number,
  payload: Record<string, unknown>,
  prevHash: string | null
): LedgerEntry {
  const createdAt = new Date().toISOString();
  const payloadJson = JSON.stringify(payload);
  const hash = computeLedgerHash(type, refId, amountMinor, payloadJson, prevHash, createdAt);

  return {
    id,
    type,
    refId,
    amountMinor,
    payloadJson,
    prevHash,
    hash,
    createdAt,
  };
}
