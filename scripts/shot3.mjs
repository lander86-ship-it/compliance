import { chromium } from "playwright-core";
const exe = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const OUT = process.argv[2] || "/tmp/rhel";
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1360, height: 900 } });
const errs = [];
p.on("pageerror", (e) => errs.push(String(e)));
await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await p.getByRole("button", { name: "My Library" }).click();
await p.waitForTimeout(300);
await p.getByRole("button", { name: "Configure & generate" }).first().click(); // RHEL 9
await p.waitForTimeout(1200); // wait for controls fetch
await p.getByText("Controls", { exact: true }).first().click(); // step 4 in rail
await p.waitForTimeout(500);
await p.screenshot({ path: `${OUT}-step4.png` });
console.log("JS_ERRORS:", errs.length ? errs.join("\n") : "none");
await b.close();
