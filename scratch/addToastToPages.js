
const fs = require('fs');
const path = require('path');

const frontendRoot = 'C:\\Users\\deham\\Desktop\\Corehead\\frontend\\app';

function addToastToPage(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log('SKIP (not found):', filePath);
        return;
    }
    let content = fs.readFileSync(filePath, 'utf8');

    if (content.includes('useToast')) {
        console.log('Already has useToast:', filePath);
        return;
    }

    // Add import after FloatingBubbles or api import
    content = content.replace(
        /import FloatingBubbles from "@\/components\/auth\/FloatingBubbles";/,
        'import FloatingBubbles from "@/components/auth/FloatingBubbles";\nimport { useToast, ToastContainer } from "@/components/ui/Toast";'
    );
    // If no FloatingBubbles, insert after api import
    if (!content.includes('useToast')) {
        content = content.replace(
            /import \{ api \} from "@\/lib\/api";/,
            'import { api } from "@/lib/api";\nimport { useToast, ToastContainer } from "@/components/ui/Toast";'
        );
    }

    // Add useToast hook after state declarations
    content = content.replace(
        /const \[success, setSuccess\] = useState(<string \| null>)?\(null\);/,
        'const [success, setSuccess] = useState<string | null>(null);\n  const { toasts, remove, success: toastSuccess, error: toastError, info: toastInfo } = useToast();'
    );

    // Replace setSuccess and setError with toasts
    content = content.replace(/setSuccess\((".*?")\)/g, (_, msg) => `toastSuccess(${msg})`);
    content = content.replace(/setError\((".*?")\)/g, (_, msg) => `toastError(${msg})`);
    content = content.replace(/setError\(err\.message \|\| (".*?")\)/g, (_, fallback) => `toastError(err.message || ${fallback})`);
    content = content.replace(/setError\(error\.message \|\| (".*?")\)/g, (_, fallback) => `toastError(error.message || ${fallback})`);
    content = content.replace(/setError\(message\)/g, 'toastError(message)');

    // Add ToastContainer to JSX (after FloatingBubbles or at start of return div)
    content = content.replace(
        /(<FloatingBubbles \/>)/,
        '<ToastContainer toasts={toasts} onRemove={remove} />\n      $1'
    );

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('UPDATED:', filePath);
}

const pagesToUpdate = [
    path.join(frontendRoot, 'forgot-password', 'page.tsx'),
    path.join(frontendRoot, 'reset-password', 'page.tsx'),
];

for (const p of pagesToUpdate) {
    addToastToPage(p);
}

console.log('\nAll done!');
