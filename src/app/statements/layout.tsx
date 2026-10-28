import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Member Payout Statements',
  description:
    'Download and review individual member payout statements, historical earnings, and settlement receipts.',
  alternates: { canonical: 'https://microsplit.ai/statements' },
  openGraph: {
    title: 'Member Payout Statements | MicroSplit AI',
    description: 'Download and review individual member payout statements and settlement receipts.',
    url: 'https://microsplit.ai/statements',
  },
};

export default function StatementsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

