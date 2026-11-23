const fs = require('fs');
const file = 'C:/Users/deham/Desktop/Corehead/frontend/components/admin/builder/SettingsPanel.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

// Find the line with "Typography" header h4 and insert font family picker after the grid closes
// We'll insert after the </div> closing the grid (grid-cols-2) before background section
// Line 120 is the grid, let's insert font family right inside Typography section, before the grid
// Insert after line 119 (index 118) which has <div className="grid grid-cols-2 gap-3">

// Find the grid line index inside Typography section
let gridLine = -1;
for (let i = 114; i < 130; i++) {
  if (lines[i] && lines[i].includes('grid grid-cols-2 gap-3')) {
    gridLine = i;
    break;
  }
}

console.log(`Grid line found at: ${gridLine + 1}: ${lines[gridLine]}`);

// Insert Font Family full-width section before the grid
const fontFamilySection = `              <div className="space-y-1">
                <label className="text-xs text-slate-600">Font Family</label>
                <select
                  className="w-full px-2 py-1.5 bg-slate-50 border border-gray-200 rounded text-sm"
                  value={selectedBlock.styles?.fontFamily || ""}
                  onChange={(e) =>
                    updateBlock(selectedBlock.id, selectedBlock.content, {
                      fontFamily: e.target.value,
                    })
                  }
                >
                  <option value="">Default</option>
                  <optgroup label="Sans Serif">
                    <option value="'Inter', sans-serif">Inter</option>
                    <option value="'Roboto', sans-serif">Roboto</option>
                    <option value="'Open Sans', sans-serif">Open Sans</option>
                    <option value="'Lato', sans-serif">Lato</option>
                    <option value="'Montserrat', sans-serif">Montserrat</option>
                    <option value="'Poppins', sans-serif">Poppins</option>
                    <option value="'Outfit', sans-serif">Outfit</option>
                    <option value="'Nunito', sans-serif">Nunito</option>
                  </optgroup>
                  <optgroup label="Serif">
                    <option value="'Georgia', serif">Georgia</option>
                    <option value="'Playfair Display', serif">Playfair Display</option>
                    <option value="'Merriweather', serif">Merriweather</option>
                    <option value="'Lora', serif">Lora</option>
                    <option value="'EB Garamond', serif">EB Garamond</option>
                  </optgroup>
                  <optgroup label="Monospace">
                    <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                    <option value="'Fira Code', monospace">Fira Code</option>
                    <option value="'Space Mono', monospace">Space Mono</option>
                  </optgroup>
                  <optgroup label="Display">
                    <option value="'Bebas Neue', cursive">Bebas Neue</option>
                    <option value="'Pacifico', cursive">Pacifico</option>
                    <option value="'Righteous', cursive">Righteous</option>
                  </optgroup>
                </select>
              </div>`;

// Insert before the grid line
lines.splice(gridLine, 0, fontFamilySection);

fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log('Font Family picker added!');
