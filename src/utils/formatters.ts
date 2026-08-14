export function formatCurrency(amount: number | null | undefined, currency = '₹', includeDecimals = true): string {
  const val = Number(amount) || 0;
  const locale = currency === '₹' || currency === 'Rs' || currency === 'INR' ? 'en-IN' : 'en-US';
  
  const formatted = val.toLocaleString(locale, {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  });

  return `${currency}${formatted}`;
}

export function formatNumber(amount: number | null | undefined, currency = '₹', decimals = 2): string {
  const val = Number(amount) || 0;
  const locale = currency === '₹' || currency === 'Rs' || currency === 'INR' ? 'en-IN' : 'en-US';
  return val.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
