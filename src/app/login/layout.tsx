import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In to MicroSplit AI',
  description:
    'Secure authentication for squad leads, contributors, and approvers. Access your revenue attribution dashboard.',
  alternates: { canonical: 'https://microsplit.ai/login' },
  openGraph: {
    title: 'Sign In | MicroSplit AI',
    description: 'Secure authentication for your revenue attribution dashboard.',
    url: 'https://microsplit.ai/login',
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

