const { spawnSync } = require('node:child_process');
const { readdirSync } = require('node:fs');
const { join, relative, resolve } = require('node:path');

const projectRoot = resolve(__dirname, '..');
const sourceRoots = ['src', 'scripts']
  .map((directory) => join(projectRoot, directory));
const currentFile = resolve(__filename);

function javascriptFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return javascriptFiles(path);
    return entry.isFile() && path.endsWith('.js') && resolve(path) !== currentFile
      ? [path]
      : [];
  });
}

const files = sourceRoots.flatMap(javascriptFiles);
const failures = [];

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    failures.push({ file, output: result.stderr || result.stdout });
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`Syntax check failed: ${relative(projectRoot, failure.file)}`);
    console.error(failure.output.trim());
  }
  process.exitCode = 1;
} else {
  console.log(`Syntax check passed for ${files.length} backend JavaScript files.`);
}
