import type { Metadata } from 'next';
import ContactFormClient from './ContactFormClient';

export const metadata: Metadata = {
  title: 'Contact Support & Enterprise Inquiries | MicroSplit AI',
  description:
    'Get in touch with the MicroSplit AI team for squad revenue attribution support, enterprise payroll questions, or integration assistance.',
  alternates: {
    canonical: 'https://microsplit.ai/contact',
  },
  openGraph: {
    title: 'Contact Support & Inquiries | MicroSplit AI',
    description:
      'Connect with our fintech settlement team via domain email (support@microsplit.ai) or 24/7 WhatsApp concierge.',
    url: 'https://microsplit.ai/contact',
    type: 'website',
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--background)] border border-[var(--accent)]/20 text-[var(--accent)] text-xs font-semibold uppercase tracking-wider mb-3">
            Direct Concierge &bull; MicroSplit AI
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--primary)] tracking-tight">
            How can our attribution team help?
          </h1>
          <p className="mt-3 text-base text-[var(--text)] max-w-xl mx-auto">
            Reach out for squad onboarding, custom split rule logic, PayPal batch payouts assistance, or enterprise agreements.
          </p>
        </div>

        <ContactFormClient />
      </div>
    </div>
  );
}
