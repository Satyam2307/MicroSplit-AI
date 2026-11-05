import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Split Run Details',
  description: 'View detailed results of a revenue split run — member shares, attribution weights, and cryptographic verification.',
};

export default function RunsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
