import type { Metadata } from 'next';

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const formattedId = id ? id.toUpperCase() : 'RUN';
  return {
    title: `Split Run ${formattedId} | MicroSplit AI`,
    description: `Audit trail, weight breakdown, and verified payouts for split run ${id}. Non-custodial math with 0-cent loss guarantee.`,
    alternates: {
      canonical: `https://microsplit.ai/runs/${id}`,
    },
    openGraph: {
      title: `Split Run ${formattedId} — MicroSplit AI`,
      description: `Cryptographic audit trail and zero-loss payout attribution for split run ${id}.`,
      url: `https://microsplit.ai/runs/${id}`,
    },
  };
}

export default function RunDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
