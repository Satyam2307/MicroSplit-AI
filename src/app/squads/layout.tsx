import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Squads Directory & Workspaces | MicroSplit AI',
  description:
    'Manage collaborative developer squads, configure revenue split rules, track verified contributors, and automate multi-currency batch settlements.',
  alternates: {
    canonical: 'https://microsplit.ai/squads',
  },
  openGraph: {
    title: 'Squads Directory & Workspaces | MicroSplit AI',
    description:
      'Manage collaborative developer squads, configure revenue split rules, track verified contributors, and automate multi-currency batch settlements.',
    url: 'https://microsplit.ai/squads',
  },
};

export default function SquadsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
