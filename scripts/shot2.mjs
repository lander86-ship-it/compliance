import { chromium } from "playwright-core";
const exe="/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const b=await chromium.launch({executablePath:exe,args:["--no-sandbox"]});
const p=await b.newPage({viewport:{width:1360,height:900}});
const errs=[];p.on("pageerror",e=>errs.push(String(e)));
// wrap the artifact content in a minimal html like the publisher does
import fs from "fs";
const body=fs.readFileSync(process.argv[2],"utf8");
const html="<!doctype html><html><head><meta charset=utf-8></head><body>"+body+"</body></html>";
const tmp=process.argv[2]+".full.html";fs.writeFileSync(tmp,html);
await p.goto("file://"+tmp,{waitUntil:"networkidle"});
await p.waitForTimeout(400);
await p.screenshot({path:process.argv[3]});
console.log("JS_ERRORS:",errs.length?errs.join("\n"):"none");
await b.close();
