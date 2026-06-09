const COUNTRY_CURRENCY: Record<string, { symbol: string; code: string }> = {
  "Argentina":     { symbol: "$",   code: "ARS" },
  "Australia":     { symbol: "$",   code: "AUD" },
  "Brazil":        { symbol: "R$",  code: "BRL" },
  "Canada":        { symbol: "$",   code: "CAD" },
  "Chile":         { symbol: "$",   code: "CLP" },
  "China":         { symbol: "¥",   code: "CNY" },
  "Colombia":      { symbol: "$",   code: "COP" },
  "Denmark":       { symbol: "kr",  code: "DKK" },
  "Egypt":         { symbol: "£",   code: "EGP" },
  "France":        { symbol: "€",   code: "EUR" },
  "Germany":       { symbol: "€",   code: "EUR" },
  "India":         { symbol: "₹",   code: "INR" },
  "Indonesia":     { symbol: "Rp",  code: "IDR" },
  "Italy":         { symbol: "€",   code: "EUR" },
  "Japan":         { symbol: "¥",   code: "JPY" },
  "Kenya":         { symbol: "KSh", code: "KES" },
  "Mexico":        { symbol: "$",   code: "MXN" },
  "Netherlands":   { symbol: "€",   code: "EUR" },
  "New Zealand":   { symbol: "$",   code: "NZD" },
  "Nigeria":       { symbol: "₦",   code: "NGN" },
  "Norway":        { symbol: "kr",  code: "NOK" },
  "Pakistan":      { symbol: "₨",   code: "PKR" },
  "Philippines":   { symbol: "₱",   code: "PHP" },
  "Poland":        { symbol: "zł",  code: "PLN" },
  "Portugal":      { symbol: "€",   code: "EUR" },
  "Saudi Arabia":  { symbol: "﷼",   code: "SAR" },
  "Singapore":     { symbol: "$",   code: "SGD" },
  "South Africa":  { symbol: "R",   code: "ZAR" },
  "South Korea":   { symbol: "₩",   code: "KRW" },
  "Spain":         { symbol: "€",   code: "EUR" },
  "Sweden":        { symbol: "kr",  code: "SEK" },
  "Switzerland":   { symbol: "Fr",  code: "CHF" },
  "Thailand":      { symbol: "฿",   code: "THB" },
  "Turkey":        { symbol: "₺",   code: "TRY" },
  "UAE":           { symbol: "د.إ", code: "AED" },
  "United Kingdom":{ symbol: "£",   code: "GBP" },
  "United States": { symbol: "$",   code: "USD" },
  "Vietnam":       { symbol: "₫",   code: "VND" },
};

export function getCurrencySymbol(country: string): string {
  return COUNTRY_CURRENCY[country]?.symbol ?? "$";
}

export function getCurrencyCode(country: string): string {
  return COUNTRY_CURRENCY[country]?.code ?? "USD";
}
