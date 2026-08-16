const fs = require('fs');
const file = 'C:/Users/deham/Desktop/Corehead/frontend/components/GlobalAlert.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

// Find the line with "window.alert = (message: any) => {"
let alertLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('window.alert = (message: any)')) {
    alertLine = i;
    break;
  }
}

console.log(`Found alert override at line ${alertLine + 1}: ${lines[alertLine]}`);

// After the closing "};", insert the confirm/prompt overrides
// That would be 2 lines after alertLine (the function body + closing)
// window.alert block:
// line alertLine:   window.alert = (message: any) => {
// line alertLine+1:   setAlertText(String(message));
// line alertLine+2: };

const insertAfter = alertLine + 3; // after the "      };" line
lines.splice(insertAfter, 0, 
  '      // Suppress native confirm/prompt browser popups',
  '      window.confirm = (_message?: string) => true;',
  '      window.prompt = (_message?: string, _defaultValue?: string) => null;'
);

fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log('Done!');

// Verify
const result = fs.readFileSync(file, 'utf8');
if (result.includes('window.confirm')) {
  console.log('SUCCESS: confirm override present');
} else {
  console.log('FAILED');
}
