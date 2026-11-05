import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Squad Hub | MicroSplit AI',
  description:
    'Manage members, governance, revenue splits, and payouts for your squad. Cryptographically verifiable governance.',
};

export default function SquadDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}