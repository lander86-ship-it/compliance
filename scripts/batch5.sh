#!/usr/bin/env bash
# Fifth batch — resolves newest API-served version per title, then imports.
cd /home/user/compliance

PAIRS=(
  "Apple_iOSiPadOS_18:stig-ios18"
  "Google_Android_15_COPE:stig-android15"
  "MS_SharePoint_2013:stig-sharepoint2013"
  "Cisco_NX-OS_Switch_RTR:stig-cisco-nxos-rtr"
  "Cisco_NX-OS_Switch_L2S:stig-cisco-nxos-l2s"
  "Juniper_EX_Series_Switches_Network_Device_Management:stig-juniper-ex-ndm"
  "BIND_9.x:stig-bind9"
  "Tanium_7.x:stig-tanium7"
  "Splunk_Enterprise_8.x_for_Linux:stig-splunk8"
  "McAfee_VirusScan_Managed_Client:stig-mcafee-vse"
  "Trellix_Application_Control_8.x:stig-trellix-appcontrol"
  "VMware_vSphere_8.0_vCenter_Appliance_Lookup_Service:stig-vsphere8-lookup"
  "VMware_vSphere_8.0_vCenter_Appliance_Perfcharts:stig-vsphere8-perfcharts"
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
echo "BATCH5_DONE"
