import { chromium } from "playwright-core";

const OUT = process.argv[2] || "/tmp/shot";
const exe = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";

const browser = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.waitForTimeout(600);

async function shot(name) {
  await page.screenshot({ path: `${OUT}-${name}.png` });
  console.log("shot", name);
}
await shot("storefront");

// open a product (click the featured bundle card)
await page.getByText("Complete Hardening Suite").first().click();
await page.waitForTimeout(400);
await shot("product");

// go to My Library tab then wizard
await page.getByRole("button", { name: "My Library" }).click();
await page.waitForTimeout(300);
await page.getByRole("button", { name: "Configure & generate" }).first().click();
await page.waitForTimeout(400);
await shot("wizard1");

// jump to review step (step 6) via the step rail
await page.getByText("Review & generate").first().click();
await page.waitForTimeout(300);
await shot("wizard6");

// Back office
await page.getByRole("button", { name: "Back Office" }).click();
await page.waitForTimeout(300);
await shot("admin-dash");
await page.getByRole("button", { name: "AI Generator" }).click();
await page.waitForTimeout(300);
await shot("admin-ingest");

await browser.close();
console.log("done");
