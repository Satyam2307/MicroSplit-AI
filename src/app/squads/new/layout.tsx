import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create New Squad | MicroSplit AI',
  description: 'Initialize a new revenue-splitting squad, define currency, add members, and configure governance.',
  alternates: {
    canonical: 'https://microsplit.ai/squads/new',
  },
  openGraph: {
    title: 'Create New Squad — MicroSplit AI',
    description: 'Set up an autonomous revenue-splitting squad in seconds.',
    url: 'https://microsplit.ai/squads/new',
  },
};

export default function NewSquadLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
