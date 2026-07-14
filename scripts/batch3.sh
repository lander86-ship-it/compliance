#!/usr/bin/env bash
# Third batch — resolves the newest API-served version per title, then imports.
cd /home/user/compliance

PAIRS=(
  "SLES_12:stig-sles12"
  "Solaris_11_SPARC:stig-solaris11"
  "IBM_AIX_7.x:stig-aix7"
  "PostgreSQL_9.x:stig-postgresql9"
  "Oracle_Database_12c:stig-oracle12c"
  "Apache_Tomcat_Application_Server_9:stig-tomcat9"
  "Cisco_ASA_VPN:stig-cisco-asa-vpn"
  "Mozilla_Firefox:stig-firefox"
  "Adobe_Acrobat_Professional_DC_Continuous:stig-adobe-acrobat"
  "VMware_vSphere_8.0_vCenter_Appliance_Photon_OS_4.0:stig-vsphere8-photon"
  "Canonical_Ubuntu_20.04_LTS:stig-ubuntu2004"
  "Edge:stig-edge"
  "Windows_Server_20122012_R2_Member_Server:stig-win2012r2"
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
echo "BATCH3_DONE"
