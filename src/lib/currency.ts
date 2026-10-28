export const getCurrencySymbol = (currency?: string) => {
  switch (currency?.toUpperCase()) {
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'INR': return '₹';
    case 'CAD': return 'CA$';
    case 'AUD': return 'A$';
    default: return '$';
  }
};
