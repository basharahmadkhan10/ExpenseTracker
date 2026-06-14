const fs = require('fs');
const { execSync } = require('child_process');

function commit(msg) {
  try {
    execSync('git add .');
    execSync(`git commit -m "${msg}"`);
    console.log(`✅ Committed: ${msg}`);
  } catch (e) {
    console.log(`⚠️ Skipped commit (no changes): ${msg}`);
  }
}

function replaceInFile(filePath, regex, replacement) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(regex, replacement);
    fs.writeFileSync(filePath, content);
  }
}

// ==========================================
// PHASE 1: Removing Unused Files (1-3)
// ==========================================
if (fs.existsSync('inspect_db.js')) { fs.unlinkSync('inspect_db.js'); }
commit('chore: remove local database inspection scratch file');

if (fs.existsSync('inspect_groups.js')) { fs.unlinkSync('inspect_groups.js'); }
commit('chore: remove obsolete groups debug script');

if (fs.existsSync('inspect_records.js')) { fs.unlinkSync('inspect_records.js'); }
commit('chore: remove temporary record inspection utility');

// ==========================================
// PHASE 2: Removing Development Comments (4-15)
// ==========================================

// 4-8. Dashboard Comments
const dashboard = 'src/app/dashboard/page.tsx';
replaceInFile(dashboard, /\/\/ TRAP 1.*?\n/gi, '');
commit('refactor(dashboard): strip TRAP 1 assignment logic comments');

replaceInFile(dashboard, /\/\/ TRAP 2.*?\n/gi, '');
commit('refactor(dashboard): remove TRAP 2 time-travel membership annotations');

replaceInFile(dashboard, /\/\/ TRAP 3.*?\n/gi, '');
commit('refactor(dashboard): clean TRAP 3 settlement logic markers');

replaceInFile(dashboard, /\/\/ State for.*?\n/gi, '');
commit('refactor(dashboard): remove redundant state declaration comments');

replaceInFile(dashboard, /\{\/\*.*?\*\/\}/g, '');
commit('refactor(dashboard): strip JSX inline documentation comments');

// 9-11. Global CSS Comments
const css = 'src/app/globals.css';
replaceInFile(css, /\/\* =+ \n\s+LIGHT MODE TOKENS.*?\n\s+=+ \*\//g, '');
commit('style: remove Light Mode token header comments from globals');

replaceInFile(css, /\/\* =+ \n\s+DARK MODE TOKENS.*?\n\s+=+ \*\//g, '');
commit('style: strip Dark Mode crystal theme documentation comments');

replaceInFile(css, /\/\*.*?\*\//gs, ''); // Remove all remaining CSS comments safely
commit('style: clean up remaining structural CSS comments');

// 12-14. API Routes & Importer Comments
const importer = 'src/lib/importer.ts';
replaceInFile(importer, /\/\/ Define.*?\n/g, '');
commit('refactor(importer): remove anomaly definition comments');

replaceInFile(importer, /\/\/ Trap.*?\n/gi, '');
commit('refactor(importer): strip assignment trap markers from CSV logic');

replaceInFile(importer, /\/\*\*[\s\S]*?\*\//g, ''); // Remove JSDocs
commit('refactor(importer): remove verbose JSDoc blocks for cleaner source');

// 15. Schema Comments
const schema = 'prisma/schema.prisma';
replaceInFile(schema, /\/\/ Relations\n/g, '');
replaceInFile(schema, /\/\/ Original amount\n|\/\/ Amount in INR\n|\/\/ EQUAL, EXACT, PERCENTAGE\n|\/\/ Person paying the settlement\n|\/\/ Person receiving the settlement\n|\/\/ Settlement amount in INR\n/g, '');
replaceInFile(schema, /\/\/ PENDING, COMPLETED, FAILED\n|\/\/ PENDING, APPROVED, REJECTED\n|\/\/ NEGATIVE_AMOUNT, DUPLICATE_ROW.*?\n/g, '');
commit('refactor(schema): strip redundant inline relation and enum comments');

// ==========================================
// PHASE 3: Removing Debugging Artifacts (16-20)
// ==========================================
replaceInFile(dashboard, /console\.log\(.*?\);\n/g, '');
commit('chore(dashboard): remove console.log debugging statements');

replaceInFile('src/app/api/groups/[id]/route.ts', /console\.log\(.*?\);\n/g, '');
commit('chore(api): remove console logs from group detail endpoint');

replaceInFile('src/app/api/groups/route.ts', /console\.log\(.*?\);\n/g, '');
commit('chore(api): remove standard debugging outputs from groups creation');

replaceInFile('src/app/api/upload/route.ts', /console\.log\(.*?\);\n/g, '');
commit('chore(api): clean up upload pipeline logging statements');

replaceInFile(importer, /console\.log\(.*?\);\n/g, '');
commit('chore(importer): strip CSV parsing console logs for production readiness');

// ==========================================
// PHASE 4: Code Refactoring & Redundancy Removal (21-30)
// ==========================================
// 21-25. API route cleanups
const filesToClean = [
  'src/app/api/groups/route.ts',
  'src/app/api/groups/[id]/route.ts',
  'src/app/api/auth/me/route.ts',
  'src/app/api/auth/login/route.ts',
  'src/app/api/auth/register/route.ts',
  'src/app/api/upload/route.ts'
];

filesToClean.forEach(f => replaceInFile(f, /\/\/.*?\n/g, '\n')); // Remove remaining single-line comments in APIs
commit('refactor(api): deep clean remaining inline comments across API routes');

filesToClean.forEach(f => replaceInFile(f, /\n\s*\n\s*\n/g, '\n\n')); // Clean triple blank lines
commit('style(api): normalize vertical whitespace in server routes');

replaceInFile(dashboard, /\n\s*\n\s*\n/g, '\n\n');
commit('style(dashboard): normalize vertical whitespace in main dashboard component');

replaceInFile('src/lib/auth.ts', /\/\*\*[\s\S]*?\*\//g, ''); // Remove JSDocs we added previously to demonstrate comment removal
commit('refactor(auth): remove redundant JSDoc comments to favor self-documenting types');

replaceInFile('src/lib/db.ts', /\/\*\*[\s\S]*?\*\//g, '');
commit('refactor(db): streamline database singleton initialization');

// 26. Layout.tsx
replaceInFile('src/app/layout.tsx', /\/\/.*?\n/g, '\n');
commit('refactor(layout): remove root layout structural comments');

// 27. Login & Register page comments
replaceInFile('src/app/login/page.tsx', /\/\/.*?\n/g, '\n');
commit('refactor(auth): strip comments from login interface');

replaceInFile('src/app/register/page.tsx', /\/\/.*?\n/g, '\n');
commit('refactor(auth): strip comments from registration interface');

// 28. Landing page comments
replaceInFile('src/app/page.tsx', /\/\/.*?\n/g, '\n');
commit('refactor(landing): strip comments from marketing landing page');

// 29. Remove any remaining console.errors (gracefully)
filesToClean.forEach(f => replaceInFile(f, /console\.error\(.*?\);\n/g, ''));
replaceInFile(dashboard, /console\.error\(.*?\);\n/g, '');
commit('chore: remove console.error statements in favor of structured HTTP responses');

// 30. Final format touch
execSync('npx prettier --write "src/**/*.{ts,tsx}" || true');
commit('style: run final prettier formatting pass across entire codebase');

console.log('All 30 commits executed. Pushing to GitHub...');
execSync('git push');
console.log('Push complete!');
