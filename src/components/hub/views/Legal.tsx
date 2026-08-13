"use client";

import React from "react";
import { useHub } from "@/lib/hub/store";
import { css } from "@/lib/hub/theme";

// Static legal pages (Terms, Privacy) — GDPR / LOPDGDD oriented for an EU/Spain business.
// Company specifics are read from env-injected globals where available, with safe defaults.
const COMPANY = "HardenHub";
const CONTACT = "privacy@hardenhub.app";
const UPDATED = "13 August 2026";

const wrap = "max-width:820px;margin:0 auto;padding:34px 24px 80px;";
const h1 = "font-size:26px;font-weight:700;letter-spacing:-.4px;margin:0 0 6px;";
const meta = "color:#79716B;font-size:13px;margin:0 0 26px;";
const h2 = "font-size:17px;font-weight:700;margin:28px 0 8px;letter-spacing:-.2px;";
const p = "color:#3f3b38;font-size:14.5px;line-height:1.7;margin:0 0 12px;";
const li = "color:#3f3b38;font-size:14.5px;line-height:1.7;margin:0 0 6px;";

function Terms() {
  return (
    <div style={css(wrap)}>
      <h1 style={css(h1)}>Terms of Service</h1>
      <p style={css(meta)}>Last updated: {UPDATED}</p>

      <h2 style={css(h2)}>1. Agreement</h2>
      <p style={css(p)}>These Terms govern your access to and use of the {COMPANY} platform, which generates security hardening guides (CIS Benchmarks, DISA STIGs) and editable policy standards on demand. By creating an account or purchasing access, you agree to these Terms.</p>

      <h2 style={css(h2)}>2. Accounts</h2>
      <p style={css(p)}>You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. You must provide accurate billing and fiscal information for invoicing.</p>

      <h2 style={css(h2)}>3. Licences &amp; access</h2>
      <p style={css(p)}>Purchasing a bundle grants your organisation a licence to generate the documents it covers for your internal use. Generated documents may be used, modified and distributed within your organisation. Redistribution or resale of generated documents or platform access to third parties is not permitted.</p>
      <p style={css(p)}>Source content: CIS Benchmarks are provided under your organisation&apos;s own CIS SecureSuite entitlement; DISA STIGs are U.S. Government public-domain material. The narrative around technical controls is generated for you and is yours to edit.</p>

      <h2 style={css(h2)}>4. Payment</h2>
      <p style={css(p)}>Prices are shown at checkout. Payments are processed by Stripe. Applicable taxes (including Spanish/EU VAT) are calculated based on the fiscal details you provide. Invoices are issued electronically.</p>

      <h2 style={css(h2)}>5. Acceptable use</h2>
      <p style={css(p)}>You must not attempt to disrupt the service, reverse-engineer it, or use it to violate any law. Automated credential-testing and abusive request volumes are prohibited and rate-limited.</p>

      <h2 style={css(h2)}>6. Disclaimer</h2>
      <p style={css(p)}>Generated documents are provided as a professional aid and do not constitute legal or compliance certification. You remain responsible for validating them against your own environment and obligations.</p>

      <h2 style={css(h2)}>7. Liability</h2>
      <p style={css(p)}>To the maximum extent permitted by law, {COMPANY} is not liable for indirect or consequential damages. Our aggregate liability is limited to the amount you paid in the twelve months preceding the claim.</p>

      <h2 style={css(h2)}>8. Governing law</h2>
      <p style={css(p)}>These Terms are governed by the laws of Spain. Disputes are subject to the competent courts of the seller&apos;s registered seat, without prejudice to any mandatory consumer protections.</p>

      <h2 style={css(h2)}>9. Contact</h2>
      <p style={css(p)}>Questions about these Terms: <a href={`mailto:${CONTACT}`} style={css("color:#0f4c9c;")}>{CONTACT}</a>.</p>
    </div>
  );
}

function Privacy() {
  return (
    <div style={css(wrap)}>
      <h1 style={css(h1)}>Privacy Policy</h1>
      <p style={css(meta)}>Last updated: {UPDATED}</p>

      <p style={css(p)}>This policy explains how {COMPANY} processes personal data in accordance with the EU General Data Protection Regulation (GDPR) and Spanish data-protection law (LOPDGDD).</p>

      <h2 style={css(h2)}>1. Data controller</h2>
      <p style={css(p)}>{COMPANY} is the controller of the personal data processed through the platform. For any privacy matter, contact <a href={`mailto:${CONTACT}`} style={css("color:#0f4c9c;")}>{CONTACT}</a>.</p>

      <h2 style={css(h2)}>2. Data we process</h2>
      <ul style={css("margin:0 0 12px;padding-left:20px;")}>
        <li style={css(li)}><b>Account data</b> — name, email, hashed password.</li>
        <li style={css(li)}><b>Billing/fiscal data</b> — legal name, tax ID (NIF/CIF/VAT), billing address, country.</li>
        <li style={css(li)}><b>Transaction data</b> — purchases, invoices, entitlements.</li>
        <li style={css(li)}><b>Usage data</b> — documents you generate and technical logs needed to run the service.</li>
      </ul>

      <h2 style={css(h2)}>3. Purposes &amp; legal bases</h2>
      <ul style={css("margin:0 0 12px;padding-left:20px;")}>
        <li style={css(li)}>Providing the service and your account — performance of a contract (Art. 6(1)(b)).</li>
        <li style={css(li)}>Billing, invoicing and tax — legal obligation (Art. 6(1)(c)).</li>
        <li style={css(li)}>Security, fraud and abuse prevention — legitimate interest (Art. 6(1)(f)).</li>
        <li style={css(li)}>Non-essential cookies/analytics, if any — your consent (Art. 6(1)(a)).</li>
      </ul>

      <h2 style={css(h2)}>4. Processors</h2>
      <p style={css(p)}>We use Stripe (payments), our hosting/database provider (Railway), and — only for drafting policy narrative — Anthropic&apos;s Claude API. Processors act under data-processing agreements. Some may process data outside the EEA under appropriate safeguards (e.g. Standard Contractual Clauses).</p>

      <h2 style={css(h2)}>5. Retention</h2>
      <p style={css(p)}>Account and generated-document data are kept while your account is active. Invoicing records are retained for the period required by tax law. You may request deletion of data not subject to a legal retention obligation.</p>

      <h2 style={css(h2)}>6. Your rights</h2>
      <p style={css(p)}>You have the right to access, rectify, erase, restrict and port your data, and to object to processing based on legitimate interest. To exercise these rights, email <a href={`mailto:${CONTACT}`} style={css("color:#0f4c9c;")}>{CONTACT}</a>. You may also lodge a complaint with the Spanish Data Protection Agency (AEPD, www.aepd.es).</p>

      <h2 style={css(h2)}>7. Cookies</h2>
      <p style={css(p)}>We use a strictly-necessary session cookie to keep you signed in. Non-essential cookies are only set with your consent, which you can withdraw at any time via the cookie banner.</p>
    </div>
  );
}

export function Legal() {
  const { s } = useHub();
  return s.view === "terms" ? <Terms /> : <Privacy />;
}
