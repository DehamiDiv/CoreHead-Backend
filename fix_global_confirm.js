const fs = require('fs');
const file = 'C:/Users/deham/Desktop/Corehead/frontend/components/GlobalAlert.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add confirm + prompt overrides
const oldUseEffect = `  useEffect(() => {
    if (typeof window !== "undefined") {
      window.alert = (message: any) => {
        setAlertText(String(message));
      };
    }
  }, []);`;

const newUseEffect = `  useEffect(() => {
    if (typeof window !== "undefined") {
      window.alert = (message: any) => {
        setAlertText(String(message));
      };
      // Override native confirm/prompt to prevent browser popups
      window.confirm = (_message?: string) => true;
      window.prompt = (_message?: string, _defaultValue?: string) => null;
    }
  }, []);`;

content = content.replace(oldUseEffect, newUseEffect);
fs.writeFileSync(file, content, 'utf8');
console.log("GlobalAlert updated. Verifying...");
console.log(fs.readFileSync(file, 'utf8').includes('window.confirm') ? "OK: confirm override added" : "FAILED");
