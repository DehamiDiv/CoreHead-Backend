const fs = require('fs');
const file = 'C:/Users/deham/Desktop/Corehead/frontend/components/admin/builder/EditorHeader.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldRegex = /const handleClear = \(\) => \{\s*setShowClearConfirm\(true\);\s*\};/;

const newFn = `const handleClear = () => {
      setShowClearConfirm(true);
    };

    const confirmClear = () => {
      loadLayout("[]");
      setShowClearConfirm(false);
      setIsActionsOpen(false);
    };`;

content = content.replace(oldRegex, newFn);
fs.writeFileSync(file, content, 'utf8');
console.log("EditorHeader fixed successfully.");
