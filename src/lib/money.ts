// All monetary amounts are stored as integer cents to avoid float errors.

export function formatMoney(cents: number, currency = "EUR"): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

// VAT rates by country (FR-C-12). Simplified table for the MVP; extend as needed.
const VAT_RATES: Record<string, number> = {
  ES: 0.21,
  IE: 0.23,
  DE: 0.19,
  FR: 0.2,
  PT: 0.23,
  IT: 0.22,
  NL: 0.21,
  US: 0.0,
  GB: 0.2,
};

// EU member states for intra-community reverse-charge handling (FR-C-12).
const EU_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE",
]);

export interface TaxResult {
  taxCents: number;
  rate: number;
  reverseCharge: boolean;
  note: string;
}

/**
 * Compute VAT for a subtotal.
 * - EU B2B with a valid VAT id in a different country than the seller → reverse charge (0%).
 * - Otherwise apply the destination-country rate.
 * Seller is assumed established in ES for this MVP.
 */
export function computeTax(
  subtotalCents: number,
  country: string | null | undefined,
  hasValidVatId: boolean,
): TaxResult {
  const cc = (country || "").toUpperCase();
  const sellerCountry = "ES";

  if (EU_COUNTRIES.has(cc) && cc !== sellerCountry && hasValidVatId) {
    return {
      taxCents: 0,
      rate: 0,
      reverseCharge: true,
      note: "EU intra-community supply — VAT reverse-charged to the customer (VIES-validated VAT id).",
    };
  }

  const rate = VAT_RATES[cc] ?? VAT_RATES.ES;
  return {
    taxCents: Math.round(subtotalCents * rate),
    rate,
    reverseCharge: false,
    note: rate > 0 ? `VAT ${(rate * 100).toFixed(0)}% (${cc || sellerCountry})` : "No VAT",
  };
}
