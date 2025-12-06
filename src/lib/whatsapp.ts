// WhatsApp sharing utilities for Geeta Traders
// Uses wa.me deeplinks (no API required)

export interface CartItem {
  name: string;
  nameHi?: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
}

export interface OrderDetails {
  customerName: string;
  address?: string;
  phone?: string;
  items: CartItem[];
  totalAmount: number;
}

export interface RateItem {
  category: string;
  brand: string;
  size?: string;
  price: number;
  unit: string;
}

// Format currency in Indian style
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Generate WhatsApp share link for order
export function generateOrderWhatsAppLink(order: OrderDetails, phoneNumber?: string): string {
  const lines: string[] = [
    '🏗️ *गीता ट्रेडर्स / Geeta Traders*',
    '📍 Mohammadabad Gohna, Mau, UP',
    '',
    '━━━━━━━━━━━━━━━━━━━━',
    `👤 *Customer / ग्राहक:* ${order.customerName}`,
  ];

  if (order.address) {
    lines.push(`📍 *Address / पता:* ${order.address}`);
  }

  lines.push('', '*Order Details / ऑर्डर विवरण:*', '');

  order.items.forEach((item, index) => {
    const itemName = item.nameHi ? `${item.name} (${item.nameHi})` : item.name;
    lines.push(
      `${index + 1}. ${itemName}`,
      `   Qty: ${item.quantity} ${item.unit} × ${formatINR(item.price)}`,
      `   = ${formatINR(item.total)}`,
      ''
    );
  });

  lines.push(
    '━━━━━━━━━━━━━━━━━━━━',
    `💰 *Total / कुल:* ${formatINR(order.totalAmount)}`,
    '',
    '🙏 धन्यवाद! Thank you for your order!',
    '📞 Contact: +91-XXXXXXXXXX'
  );

  const message = lines.join('\n');
  const encodedMessage = encodeURIComponent(message);

  if (phoneNumber) {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  }

  return `https://wa.me/?text=${encodedMessage}`;
}

// Generate WhatsApp share link for daily rates
export function generateRatesWhatsAppLink(rates: RateItem[], date?: string): string {
  const dateStr = date || new Date().toLocaleDateString('hi-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const lines: string[] = [
    '🏗️ *गीता ट्रेडर्स / Geeta Traders*',
    '📍 Mohammadabad Gohna, Mau, UP',
    '',
    `📅 *आज का रेट / Today\'s Rate*`,
    `📆 ${dateStr}`,
    '',
    '━━━━━━━━━━━━━━━━━━━━',
  ];

  // Group rates by category
  const groupedRates: Record<string, RateItem[]> = {};
  rates.forEach(rate => {
    if (!groupedRates[rate.category]) {
      groupedRates[rate.category] = [];
    }
    groupedRates[rate.category].push(rate);
  });

  Object.entries(groupedRates).forEach(([category, categoryRates]) => {
    lines.push('', `*${category}:*`);
    categoryRates.forEach(rate => {
      const sizeStr = rate.size ? ` (${rate.size})` : '';
      lines.push(`• ${rate.brand}${sizeStr}: ${formatINR(rate.price)}/${rate.unit}`);
    });
  });

  lines.push(
    '',
    '━━━━━━━━━━━━━━━━━━━━',
    '',
    '📞 For orders, contact us!',
    '🙏 धन्यवाद!'
  );

  const message = lines.join('\n');
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

// Generate WhatsApp share link for TMT calculation
export function generateTMTCalculationLink(
  diameter: number,
  length: number,
  pieces: number,
  weight: number,
  pricePerKg?: number
): string {
  const lines: string[] = [
    '🏗️ *गीता ट्रेडर्स / Geeta Traders*',
    '',
    '📐 *TMT Weight Calculation*',
    '━━━━━━━━━━━━━━━━━━━━',
    '',
    `📏 Diameter / व्यास: ${diameter}mm`,
    `📐 Length / लंबाई: ${length} meters`,
    `🔢 Pieces / टुकड़े: ${pieces}`,
    '',
    `⚖️ *Total Weight / कुल वजन: ${weight.toFixed(2)} kg*`,
  ];

  if (pricePerKg) {
    const totalPrice = weight * pricePerKg;
    lines.push(
      '',
      `💰 Rate / रेट: ${formatINR(pricePerKg)}/kg`,
      `💵 *Total / कुल: ${formatINR(totalPrice)}*`
    );
  }

  lines.push(
    '',
    '━━━━━━━━━━━━━━━━━━━━',
    '📞 गीता ट्रेडर्स से संपर्क करें!',
    '🙏 धन्यवाद!'
  );

  const message = lines.join('\n');
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

// Open WhatsApp with the generated link
export function openWhatsApp(link: string): void {
  window.open(link, '_blank');
}