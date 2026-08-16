const fs = require('fs');
const file = 'C:/Users/deham/Desktop/Corehead/frontend/components/admin/builder/LeftSidebar.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove the AI Assistant button
const aiButtonRegex = /<button[\s\S]*?onClick=\{\(\) => setActiveSidebar\("chat"\)\}[\s\S]*?<\/button>/;
content = content.replace(aiButtonRegex, '');

// Also replace activeSidebar === "chat" check so the ChatPanel isn't rendered
content = content.replace(/{activeSidebar === "chat" \? \(\s*<ChatPanel[\s\S]*?\)\s*:\s*activeSidebar === "blocks"/, '{activeSidebar === "blocks"');

fs.writeFileSync(file, content, 'utf8');
console.log("LeftSidebar updated successfully.");
