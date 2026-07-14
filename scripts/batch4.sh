#!/usr/bin/env bash
# Fourth batch — resolves newest API-served version per title, then imports.
cd /home/user/compliance

PAIRS=(
  "Apple_macOS_15_(Sequoia):stig-macos15"
  "Oracle_Linux_8:stig-oracle-linux8"
  "VMware_vSphere_7.0_ESXi:stig-vsphere7-esxi"
  "VMware_vSphere_7.0_vCenter:stig-vsphere7-vcenter"
  "Cisco_IOS_XE_Switch_RTR:stig-cisco-switch-rtr"
  "Cisco_IOS_XR_Router_RTR:stig-cisco-iosxr-rtr"
  "Cisco_IOS_XR_Router_NDM:stig-cisco-iosxr-ndm"
  "F5_BIG-IP_Local_Traffic_Manager:stig-f5-bigip-ltm"
  "Palo_Alto_Networks_ALG:stig-paloalto-alg"
  "MongoDB_Enterprise_Advanced_4.x:stig-mongodb4"
  "Apache_Server_2.4_Windows_Server:stig-apache24-win"
  "IIS_10.0_Site:stig-iis10-site"
  "Exchange_2019_Mailbox_Server:stig-exchange2019-mbx"
  "Office_365_ProPlus:stig-office365"
  "DotNet_Framework_4.0:stig-dotnet4"
  "Defender_Antivirus:stig-defender-av"
  "Windows_Defender_Firewall_with_Advanced_Security:stig-windows-firewall"
)
ALL_SLUGS=""

for pair in "${PAIRS[@]}"; do
  key="${pair%%:*}"; slug="${pair##*:}"
  read ver rel < <(node scripts/resolve-version.mjs "$key")
  if [ -z "$ver" ]; then echo "SKIP $key (no served version)"; continue; fi
  if node scripts/import-trackr.mjs "$key" "$ver" "$rel" "$slug"; then ALL_SLUGS="$ALL_SLUGS $slug"; fi
done

echo "=== enrich all ==="
node scripts/enrich-cci.mjs scratchpad/cci_x/U_CCI_List.xml $ALL_SLUGS
echo "BATCH4_DONE"
