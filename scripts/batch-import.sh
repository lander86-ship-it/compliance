#!/usr/bin/env bash
# Import a batch of STIGs via the trackr API importer, auto-selecting the latest version.
cd /home/user/compliance

PAIRS=(
  "Red_Hat_Enterprise_Linux_8:stig-rhel8"
  "MS_SQL_Server_2016_Instance:stig-mssql2016"
  "Apache_Server_2.4_UNIX_Server:stig-apache24"
  "IIS_10.0_Server:stig-iis10"
  "Docker_Enterprise_2.x_LinuxUNIX:stig-docker"
  "Cisco_IOS_XE_Switch_NDM:stig-cisco-switch-ndm"
  "Cisco_IOS_XE_Switch_L2S:stig-cisco-switch-l2s"
  "VMware_vSphere_8.0_ESXi:stig-vsphere8-esxi"
)
ALL_SLUGS="stig-win2016 stig-win10"

for pair in "${PAIRS[@]}"; do
  key="${pair%%:*}"; slug="${pair##*:}"; ALL_SLUGS="$ALL_SLUGS $slug"
  read ver rel < <(node -e '
    const d=JSON.parse(require("fs").readFileSync("scratchpad/stiglist.json","utf8"));
    const arr=d[process.argv[1]]||[];
    let best=null;for(const e of arr){const s=(+e.version)*100+(+e.release);if(!best||s>best.s)best={s,v:e.version,r:e.release};}
    process.stdout.write(best?best.v+" "+best.r:"");
  ' "$key")
  [ -z "$ver" ] && { echo "SKIP $key"; continue; }
  node scripts/import-trackr.mjs "$key" "$ver" "$rel" "$slug"
done

echo "=== enrich all ==="
node scripts/enrich-cci.mjs scratchpad/cci_x/U_CCI_List.xml $ALL_SLUGS
echo "BATCH_DONE"
