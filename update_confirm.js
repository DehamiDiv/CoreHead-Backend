const fs = require('fs');
const file = 'C:/Users/deham/Desktop/Corehead/frontend/components/admin/builder/EditorHeader.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add AnimatePresence and motion imports
if (!content.includes('framer-motion')) {
  content = content.replace('import Link from "next/link";', 'import Link from "next/link";\nimport { motion, AnimatePresence } from "framer-motion";');
}

// 2. Add state
const stateHook = '  const [showClearConfirm, setShowClearConfirm] = useState(false);';
if (!content.includes('showClearConfirm')) {
  content = content.replace('  const [isActionsOpen, setIsActionsOpen] = useState(false);', '  const [isActionsOpen, setIsActionsOpen] = useState(false);\n' + stateHook);
}

// 3. Update handleClear function
const oldClearFnRegex = /const handleClear = \(\) => \{\s*if \(\s*confirm\([\s\S]*?\)\s*\) \{\s*loadLayout\("\[\]"\);\s*\}\s*setIsActionsOpen\(false\);\s*\};/;
const newClearFn = `const handleClear = () => {
    setShowClearConfirm(true);
    setIsActionsOpen(false);
  };
  
  const confirmClear = () => {
    loadLayout("[]");
    setShowClearConfirm(false);
  };`;
content = content.replace(oldClearFnRegex, newClearFn);

// 4. Add the modal UI right before the closing </header> or return statement's main div end
const modalUI = `
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowClearConfirm(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100/50 flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
                <Trash2 size={24} />
              </div>
              
              <h4 className="text-base font-extrabold text-slate-900 mb-2 uppercase tracking-tight">
                Clear Canvas
              </h4>
              
              <p className="text-[15px] leading-relaxed text-slate-600 mb-6 px-2">
                Are you sure you want to clear the entire canvas? This cannot be undone.
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmClear}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-[0_4px_12px_rgba(220,38,38,0.25)] hover:shadow-[0_6px_16px_rgba(220,38,38,0.35)]"
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
`;

content = content.replace('    </header>', modalUI + '\n    </header>');

fs.writeFileSync(file, content, 'utf8');
console.log("EditorHeader updated successfully.");
