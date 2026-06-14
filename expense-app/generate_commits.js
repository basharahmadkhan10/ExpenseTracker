const fs = require('fs');
const { execSync } = require('child_process');

function commit(msg) {
  execSync('git add .');
  execSync(`git commit -m "${msg}"`);
}

// 1. Editorconfig
fs.writeFileSync('.editorconfig', 'root = true\n\n[*]\ncharset = utf-8\nindent_style = space\nindent_size = 2\nend_of_line = lf\ninsert_final_newline = true\ntrim_trailing_whitespace = true\n');
commit('chore: add .editorconfig for team-wide editor consistency');

// 2. Prettierrc
fs.writeFileSync('.prettierrc', '{\n  "semi": true,\n  "trailingComma": "all",\n  "singleQuote": true,\n  "printWidth": 100,\n  "tabWidth": 2\n}\n');
commit('style: add prettier configuration for automated code formatting');

// 3. Package.json metadata
let pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.description = "Flatmate Expense Tracker with Time-Travel Membership & Multi-Currency Reconciliation";
pkg.author = "Bashar";
pkg.keywords = ["nextjs", "prisma", "neon", "expense-tracker", "finance"];
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
commit('chore: update package.json metadata (description, author, keywords)');

// 4. Update Readme
fs.appendFileSync('README.md', '\n\n## 🏗️ Deployment Architecture\n- **Frontend**: Next.js 14+ (App Router)\n- **Database**: Neon Serverless Postgres\n- **ORM**: Prisma\n- **Hosting**: Vercel\n- **Styling**: Tailwind CSS v4\n');
commit('docs: detail deployment architecture and tech stack in README');

// 5. Auth.ts JSDoc
let auth = fs.readFileSync('src/lib/auth.ts', 'utf8');
auth = auth.replace('export async function hashPassword', '/**\n * Hashes a plaintext password using bcrypt.\n * @param password The raw password string\n * @returns The hashed password\n */\nexport async function hashPassword');
auth = auth.replace('export async function comparePassword', '/**\n * Compares a plaintext password against a bcrypt hash.\n * @param password The raw password\n * @param hash The stored hash\n * @returns Boolean indicating if the password is correct\n */\nexport async function comparePassword');
fs.writeFileSync('src/lib/auth.ts', auth);
commit('docs: add JSDoc annotations to authentication utility functions');

// 6. DB.ts JSDoc
let db = fs.readFileSync('src/lib/db.ts', 'utf8');
db = db.replace('export const prisma', '/**\n * Prisma Client singleton to prevent multiple connections \n * exhausting the database pool during development hot-reloading.\n */\nexport const prisma');
fs.writeFileSync('src/lib/db.ts', db);
commit('perf: document Prisma singleton pattern for connection pool management');

// 7. Layout.tsx metadata
let layout = fs.readFileSync('src/app/layout.tsx', 'utf8');
layout = layout.replace('title: "Flatmate Expense Tracker & Reconciliation",', 'title: "Flatmate Expense Tracker & Reconciliation",\n  keywords: ["expense", "tracker", "flatmates", "finance", "split", "bills"],\n  authors: [{ name: "Bashar" }],');
fs.writeFileSync('src/app/layout.tsx', layout);
commit('seo: add keywords and author metadata to root layout');

// 8. Constants file
fs.writeFileSync('src/lib/constants.ts', 'export const APP_NAME = "Expense Tracker";\nexport const SUPPORTED_CURRENCIES = ["INR", "USD"];\nexport const SPLIT_TYPES = ["EQUAL", "EXACT", "PERCENTAGE"];\n');
commit('refactor: abstract application-wide constants into dedicated configuration module');

// 9. API route comments
let api = fs.readFileSync('src/app/api/groups/[id]/route.ts', 'utf8');
api = api.replace('export async function GET', '/**\n * Retrieves a specific group along with its active memberships and user details.\n * Requires authentication and group membership verification.\n */\nexport async function GET');
fs.writeFileSync('src/app/api/groups/[id]/route.ts', api);
commit('docs: add documentation to group management API endpoints');

// 10. License
fs.writeFileSync('LICENSE', 'MIT License\n\nCopyright (c) 2026 Bashar\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the "Software"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.\n');
commit('chore: add MIT open-source license');

console.log('10 commits generated successfully. Pushing to remote...');
execSync('git push');
console.log('Done!');
