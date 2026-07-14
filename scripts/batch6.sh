#!/usr/bin/env bash
# Sixth batch — resolves newest API-served version per title, then imports.
cd /home/user/compliance

PAIRS=(
  "Canonical_Ubuntu_24.04_LTS:stig-ubuntu2404"
  "Red_Hat_OpenShift_Container_Platform_4.x:stig-openshift4"
  "Oracle_MySQL_8.0:stig-mysql8"
  "MariaDB_Enterprise_10.x:stig-mariadb10"
  "IBM_zOS_RACF:stig-zos-racf"
  "Cisco_ISE_NDM:stig-cisco-ise-ndm"
  "Cisco_ISE_NAC:stig-cisco-ise-nac"
  "Cisco_IOS_XE_Router_NDM:stig-cisco-ios-ndm"
  "AAA_Services_Security_Requirements_Guide:stig-aaa"
  "VMware_NSX_4.x_Manager_NDM:stig-nsx4-manager"
  "Nutanix_AOS_5.20.x_OS:stig-nutanix-aos"
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
echo "BATCH6_DONE"
