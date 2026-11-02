import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, GitBranch, Code } from 'lucide-react';

export const metadata: Metadata = {
  title: 'MIT License | MicroSplit AI',
  description: 'Open source licensing information for MicroSplit AI core attribution and calculation engine.',
  alternates: {
    canonical: 'https://microsplit.ai/licence',
  },
  openGraph: {
    title: 'MIT License — MicroSplit AI',
    description: 'Open source licensing for MicroSplit AI.',
    url: 'https://microsplit.ai/licence',
  },
};

export default function LicencePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F9D8A] hover:underline mb-8"
        >
          <ArrowLeft size={16} />
          Back to Overview
        </Link>

        {/* Hero banner */}
        <div className="bg-[#0B1F3A] text-white rounded-3xl p-8 sm:p-12 mb-10 shadow-xl border border-[#102C4D]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F9D8A]/20 border border-[#0F9D8A]/40 text-[#DDF7F3] text-xs font-bold uppercase tracking-wider mb-4">
            <GitBranch size={14} className="text-[#0F9D8A]" />
            Open Source
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-4 text-white">
            MIT License
          </h1>
          <p className="text-base text-slate-300 max-w-2xl leading-relaxed">
            MicroSplit AI core calculation libraries and smart distribution algorithms are provided freely under the permissive MIT Open Source License.
          </p>
        </div>

        {/* Content sections */}
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm text-slate-700 leading-relaxed font-mono text-xs sm:text-sm">
          <p className="font-bold text-[#0B1F3A] mb-4">Copyright (c) 2026 MicroSplit AI, Inc.</p>
          <p className="mb-4">
            Permission is hereby granted, free of charge, to any person obtaining a copy
            of this software and associated documentation files (the &quot;Software&quot;), to deal
            in the Software without restriction, including without limitation the rights
            to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
            copies of the Software, and to permit persons to whom the Software is
            furnished to do so, subject to the following conditions:
          </p>
          <p className="mb-4">
            The above copyright notice and this permission notice shall be included in all
            copies or substantial portions of the Software.
          </p>
          <p className="uppercase text-slate-500 text-xs">
            THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
            IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
            FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
            AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
            LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
            OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
            SOFTWARE.
          </p>
        </div>
      </div>
    </div>
  );
}
