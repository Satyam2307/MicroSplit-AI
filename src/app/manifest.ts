import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MicroSplit AI — Squad Revenue Attribution & Automated Settlements',
    short_name: 'MicroSplit AI',
    description: 'Autonomous squad revenue attribution and instant zero-loss PayPal batch disbursements.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B1F3A',
    theme_color: '#0B1F3A',
    icons: [
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
