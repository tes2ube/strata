// Generates docs/SETTINGS.md from the settings definitions. Run: npm run docs
import { writeFileSync } from 'node:fs';
import { SETTINGS, GROUPS } from '../src/settings/definitions.js';
let md = `# Settings reference\n\nGenerated from \`src/settings/definitions.js\` (${SETTINGS.length} settings). Do not edit by hand. Every value is editable in the in-app Settings panel, which is built from the same list.\n\n`;
for (const [g, name] of GROUPS) {
  const rows = SETTINGS.filter((s) => s.group === g);
  md += `## ${name}\n\n| Key | Name | Default | Range | What it does |\n|---|---|---|---|---|\n`;
  for (const s of rows) {
    const range = s.type === 'number' ? `${s.min ?? ''} to ${s.max ?? ''}${s.unit ? ' ' + s.unit : ''}` : s.type === 'select' ? s.options.join(' / ') : s.type;
    md += `| \`${s.key}\` | ${s.label} | \`${String(s.default) || '(empty)'}\` | ${range} | ${s.help.replace(/\|/g, '/')} |\n`;
  }
  md += '\n';
}
writeFileSync(new URL('../docs/SETTINGS.md', import.meta.url), md);
console.log('wrote docs/SETTINGS.md', SETTINGS.length);
