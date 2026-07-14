#!/usr/bin/env bash
# Second batch of STIG imports via the trackr API (auto-selects latest version).
cd /home/user/compliance

PAIRS=(
  "Red_Hat_Enterprise_Linux_7:stig-rhel7"
  "Oracle_Database_19c:stig-oracle19c"
  "MongoDB_Enterprise_Advanced_8.x:stig-mongodb8"
  "Cisco_ASA_NDM:stig-cisco-asa-ndm"
  "Cisco_NX-OS_Switch_NDM:stig-cisco-nxos-ndm"
  "Juniper_SRX_Services_Gateway_NDM:stig-juniper-srx-ndm"
  "Palo_Alto_Networks_NDM:stig-paloalto-ndm"
  "VMware_vSphere_8.0_vCenter:stig-vsphere8-vcenter"
  "Google_Chrome_Current_Windows:stig-chrome"
  "F5_BIG-IP_Device_Management:stig-f5-bigip-ndm"
)
ALL_SLUGS=""

for pair in "${PAIRS[@]}"; do
  key="${pair%%:*}"; slug="${pair##*:}"; ALL_SLUGS="$ALL_SLUGS $slug"
  read ver rel < <(node -e '
    const d=JSON.parse(require("fs").readFileSync("scratchpad/stiglist.json","utf8"));
    const arr=d[process.argv[1]]||[];
    let best=null;for(const e of arr){const s=(+e.version)*100+(+e.release);if(!best||s>best.s)best={s,v:e.version,r:e.release};}
    process.stdout.write(best?best.v+" "+best.r:"");
  ' "$key")
  [ -z "$ver" ] && { echo "SKIP $key (not found)"; continue; }
  node scripts/import-trackr.mjs "$key" "$ver" "$rel" "$slug"
done

echo "=== enrich all ==="
node scripts/enrich-cci.mjs scratchpad/cci_x/U_CCI_List.xml $ALL_SLUGS
echo "BATCH2_DONE"
