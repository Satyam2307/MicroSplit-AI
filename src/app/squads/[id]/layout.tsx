import type { Metadata } from 'next';
import { mockSquads } from '@/lib/mock-data';

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const squad = mockSquads.find((s) => s.id === id);
  const name = squad ? squad.name : `Squad ${id}`;
  return {
    title: `${name} | Squad Hub | MicroSplit AI`,
    description: `Manage members, governance, revenue splits, and payouts for ${name}. Cryptographically verifiable governance.`,
    alternates: {
      canonical: `https://microsplit.ai/squads/${id}`,
    },
    openGraph: {
      title: `${name} — Squad Hub | MicroSplit AI`,
      description: `Roster, active splits, and revenue governance for ${name}.`,
      url: `https://microsplit.ai/squads/${id}`,
    },
  };
}

export default function SquadDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
