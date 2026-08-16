const fs = require('fs');
const file = 'C:/Users/deham/Desktop/Corehead/frontend/components/admin/builder/EditorHeader.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

// Find line indices
let handleClearLine = -1;
let confirmClearLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const handleClear = () =>') && handleClearLine === -1) handleClearLine = i;
  if (lines[i].includes('const confirmClear = () =>') && confirmClearLine === -1) confirmClearLine = i;
}

console.log(`handleClear at line ${handleClearLine+1}: "${lines[handleClearLine]}"`);
console.log(`confirmClear at line ${confirmClearLine+1}: "${lines[confirmClearLine]}"`);

// Fix confirmClear to be at proper indentation (same as handleClear = 2 spaces)
// Currently nested inside handleClear's closing bracket
// The structure is lines[handleClearLine] to confirmClearLine+3 or so
// Let's just rewrite those lines cleanly

lines[handleClearLine]     = '  const handleClear = () => {';
lines[handleClearLine + 1] = '    setShowClearConfirm(true);';
lines[handleClearLine + 2] = '  };';
lines[handleClearLine + 3] = '';
lines[confirmClearLine]     = '  const confirmClear = () => {';
lines[confirmClearLine + 1] = '    loadLayout("[]");';
lines[confirmClearLine + 2] = '    setShowClearConfirm(false);';
lines[confirmClearLine + 3] = '    setIsActionsOpen(false);';
lines[confirmClearLine + 4] = '  };';

fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log('\nDone! Verifying final state:');

const finalLines = fs.readFileSync(file, 'utf8').split('\n');
for (let i = handleClearLine - 1; i < confirmClearLine + 6; i++) {
  console.log(`Line ${i+1}: ${finalLines[i]}`);
}
