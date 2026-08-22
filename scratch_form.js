const fs = require('fs');
let content = fs.readFileSync('src/screens/FreelancerAddVehicleScreen.tsx', 'utf8');

const fields = [
  { key: 'customerName', name: 'Customer Name', type: 'text', placeholder: 'Enter owner name' },
  { key: 'customerMobileNumber', name: 'Customer Mobile Number', type: 'phone', placeholder: 'Enter 10-digit number' },
  { key: 'registrationNumber', name: 'Registration Number (RTO)', type: 'text', placeholder: 'e.g. MH01AB1234', props: 'autoCapitalize="characters"' },
  { key: 'brand', name: 'Brand / Make', type: 'text', placeholder: 'e.g. Honda', row: true },
  { key: 'model', name: 'Model', type: 'text', placeholder: 'e.g. City', row: true },
  { key: 'variant', name: 'Variant', type: 'text', placeholder: 'e.g. ZX CVT' },
  { key: 'manufacturingYear', name: 'Manufacturing Year', type: 'select', options: 'yearOptions', row: true },
  { key: 'registrationYear', name: 'Registration Year', type: 'select', options: 'yearOptions', row: true },
  { key: 'fuelType', name: 'Fuel Type', type: 'select', options: 'fuelTypeOptions', row: true },
  { key: 'transmission', name: 'Transmission', type: 'select', options: 'transmissionOptions', row: true },
  { key: 'odometerReading', name: 'Odometer Reading (km)', type: 'number', placeholder: 'e.g. 45000' },
  { key: 'ownerProfileStatus', name: 'Owner Profile', type: 'select', options: 'ownerProfileStatusOptions', row: true },
  { key: 'insuranceValidity', name: 'Insurance Status', type: 'select', options: '["Valid (Comprehensive)", "Valid (Third Party)", "Expired", "No Insurance"]', row: true },
  { key: 'price', name: 'Expected Price / Suggested Price', type: 'number', placeholder: 'e.g. 500000' },
  { key: 'location', name: 'Location', type: 'text', placeholder: 'e.g. Mumbai, Borivali West' },
  { key: 'underHypothecation', name: 'Under Hypothecation', type: 'select', options: '["Yes", "No", "N/A"]', row: true },
  { key: 'accidental', name: 'Accidental Status', type: 'select', options: '["No", "Yes"]', row: true },
  { key: 'rtoInformation', name: 'RTO Information', type: 'text', placeholder: 'e.g. MH-01 Mumbai Tardeo' }
];

let generatedFields = '';
let inRow = false;

for (let i = 0; i < fields.length; i++) {
  const f = fields[i];
  
  let fieldStr = `\n<View style={[styles.fieldBlock${f.row ? ', { flex: 1 }' : ''}]}>
  <Text style={[styles.label, { color: colors.foreground }]}>${f.name}</Text>\n`;

  if (f.type === 'select') {
    fieldStr += `  <CustomSelect
    label="${f.name}"
    value={formData.${f.key}}
    options={${f.options}}
    onSelect={(v: string) => handleInputChange('${f.key}', v)}
    colors={colors}
    isDark={isDark}
    hasError={!!errors.${f.key}}
  />\n`;
  } else {
    fieldStr += `  <TextInput
    style={[styles.input, { borderColor: errors.${f.key} ? '#F43F5E' : colors.border, backgroundColor: isDark ? '#171A24' : '#F2F4FA', color: colors.foreground }]}
    placeholder="${f.placeholder}"
    ${f.type === 'phone' ? 'keyboardType="phone-pad"' : f.type === 'number' ? 'keyboardType="number-pad"' : ''}
    ${f.props ? f.props : ''}
    placeholderTextColor={colors.mutedForeground}
    value={formData.${f.key}}
    onChangeText={(val) => handleInputChange('${f.key}', ${f.key === 'registrationNumber' ? 'val.toUpperCase()' : 'val'})}
  />\n`;
  }
  
  fieldStr += `  {errors.${f.key} && <Text style={styles.errorText}>{errors.${f.key}}</Text>}
</View>\n`;

  if (f.row) {
    if (!inRow) {
      generatedFields += '\n<View style={{ flexDirection: \'row\', gap: 12 }}>' + fieldStr;
      inRow = true;
    } else {
      generatedFields += fieldStr + '</View>\n';
      inRow = false;
    }
  } else {
    if (inRow) {
      generatedFields += '</View>\n';
      inRow = false;
    }
    generatedFields += fieldStr;
  }
}

// Find Step 0 View
const regex = /{step === 0 && \(\s*<View style={{ gap: 16 }}>([\s\S]*?)<\/View>\s*\)}/;
const replacement = `{step === 0 && (<View style={{ gap: 16 }}>${generatedFields}</View>)}`;

content = content.replace(regex, replacement);

fs.writeFileSync('src/screens/FreelancerAddVehicleScreen.tsx', content);
console.log('Successfully replaced form fields and injected errors UI');
