import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Immutable Ledger & Audit Trail',
  description:
    'Tamper-evident double-entry ledger with SHA-256 state transitions for every squad revenue split and member disbursement.',
  alternates: { canonical: 'https://microsplit.ai/ledger' },
  openGraph: {
    title: 'Immutable Ledger & Audit Trail | MicroSplit AI',
    description: 'Tamper-evident double-entry ledger with SHA-256 state transitions.',
    url: 'https://microsplit.ai/ledger',
  },
};

export default function LedgerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

