/**
 * Format numbers using Indian digit grouping system (e.g. ₹18,640 or ₹1,45,000)
 */
export function formatRupee(amount: number): string {
  if (isNaN(amount)) return '₹0';
  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount));

  const str = absAmount.toString();
  if (str.length <= 3) {
    return (isNegative ? '-₹' : '₹') + str;
  }

  const lastThree = str.substring(str.length - 3);
  const otherDigits = str.substring(0, str.length - 3);
  const formattedOther = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ',');

  return (isNegative ? '-₹' : '₹') + formattedOther + ',' + lastThree;
}

export function formatCompactRupee(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)} L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}k`;
  }
  return `₹${amount}`;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}
