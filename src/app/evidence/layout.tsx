import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Focus Evidence & Contribution Signals',
  description:
    'Review proof-of-focus sessions, commit evidence, and AI-extracted attribution signals for transparent squad revenue splits.',
  alternates: { canonical: 'https://microsplit.ai/evidence' },
  openGraph: {
    title: 'Focus Evidence & Contribution Signals | MicroSplit AI',
    description: 'Review proof-of-focus sessions, commit evidence, and AI-extracted attribution signals.',
    url: 'https://microsplit.ai/evidence',
  },
};

export default function EvidenceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

