import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Batch Payouts & Settlement Engine | MicroSplit AI',
  description:
    'Monitor PayPal batch payout runs, track transaction statuses, verify member disbursements, and handle unclaimed transfers.',
  alternates: {
    canonical: 'https://microsplit.ai/payouts',
  },
  openGraph: {
    title: 'Batch Payouts & Settlement Engine | MicroSplit AI',
    description:
      'Monitor PayPal batch payout runs, track transaction statuses, verify member disbursements, and handle unclaimed transfers.',
    url: 'https://microsplit.ai/payouts',
  },
};

export default function PayoutsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
