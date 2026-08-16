const fs = require('fs');
const file = 'C:/Users/deham/Desktop/Corehead/frontend/components/admin/builder/EditorHeader.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix the indentation issue - confirmClear is incorrectly nested inside handleClear
// Replace the broken block with a clean version
const brokenBlock = `  const handleClear = () => {
      setShowClearConfirm(true);
    };

    const confirmClear = () => {
      loadLayout("[]");
      setShowClearConfirm(false);
      setIsActionsOpen(false);
    };`;

const fixedBlock = `  const handleClear = () => {
    setShowClearConfirm(true);
  };

  const confirmClear = () => {
    loadLayout("[]");
    setShowClearConfirm(false);
    setIsActionsOpen(false);
  };`;

content = content.replace(brokenBlock, fixedBlock);
fs.writeFileSync(file, content, 'utf8');
console.log("Fixed successfully. Verifying...");

// Verify
const result = fs.readFileSync(file, 'utf8');
const lines = result.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('handleClear') || lines[i].includes('confirmClear')) {
    console.log(`Line ${i+1}: ${lines[i]}`);
  }
}
