export function formatCurrency(amount, currency = 'BDT') {
  if (amount === null || amount === undefined) return `0 ${currency}`;
  const num = parseFloat(amount);
  if (isNaN(num)) return `0 ${currency}`;
  
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  
  let formatted;
  if (absNum >= 1000) {
    formatted = absNum.toLocaleString('en-BD', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  } else {
    formatted = absNum % 1 === 0 ? absNum.toString() : absNum.toFixed(2);
  }
  
  return `${isNegative ? '-' : ''}${formatted} ${currency}`;
}

export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return parseFloat(num).toLocaleString('en-BD');
}

export function getBalanceColor(balance) {
  if (balance < 0) return '#dc2626';
  if (balance < 50) return '#ef4444';
  if (balance < 100) return '#f59e0b';
  if (balance < 200) return '#eab308';
  return '#22c55e';
}

export function getBalanceStatus(balance) {
  if (balance < 0) return 'Negative';
  if (balance < 50) return 'Critical';
  if (balance < 100) return 'Low';
  if (balance < 200) return 'Medium';
  return 'Good';
}
