import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Execute Split Run & Attribution | MicroSplit AI',
  description:
    'Calculate deterministic member payouts, run AI proof-of-focus attribution checks, and preview PayPal batch settlements.',
  alternates: {
    canonical: 'https://microsplit.ai/splits/new',
  },
  openGraph: {
    title: 'Execute Split Run & Attribution | MicroSplit AI',
    description:
      'Calculate deterministic member payouts, run AI proof-of-focus attribution checks, and preview PayPal batch settlements.',
    url: 'https://microsplit.ai/splits/new',
  },
};

export default function SplitsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
