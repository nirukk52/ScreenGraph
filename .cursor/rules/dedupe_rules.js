// Utility to remove duplicated root XML blocks in rule .mdc files.
// Why it exists: The initial split duplicated root sections; this script trims content after the first closing tag.

import fs from "node:fs";
import path from "node:path";

const rulesDir = path.resolve(path.dirname(new URL(import.meta.url).pathname));

const files = fs
  .readdirSync(rulesDir)
  .filter((file) => file.endsWith(".mdc"));

files.forEach((file) => {
  const filePath = path.join(rulesDir, file);
  const content = fs.readFileSync(filePath, "utf8");

  const tagMatch = content.match(/\n<([a-z0-9_\-]+)>/i);
  if (!tagMatch) {
    return;
  }

  const tag = tagMatch[1];
  const closingToken = `</${tag}>`;
  const closingIdx = content.indexOf(closingToken);

  if (closingIdx === -1) {
    return;
  }

  const closingEnd = closingIdx + closingToken.length;
  const remainder = content.slice(closingEnd);

  if (!remainder.trim()) {
    return;
  }

  const trimmed = `${content.slice(0, closingEnd)}\n`;
  fs.writeFileSync(filePath, trimmed, "utf8");
});


