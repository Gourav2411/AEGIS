const fs = require('fs');

const templatesContent = fs.readFileSync('templates.txt', 'utf8');
const inputPanelPath = 'src/components/InputPanel.tsx';
let inputPanelContent = fs.readFileSync(inputPanelPath, 'utf8');

const startMarker = 'const PREDEFINED_TEMPLATES: Record<string, FormData> = {';

const startIndex = inputPanelContent.indexOf(startMarker);
if (startIndex === -1) {
  console.error("Could not find PREDEFINED_TEMPLATES start marker.");
  process.exit(1);
}

// Find the matching closing brace for the PREDEFINED_TEMPLATES object
let openBraces = 0;
let endIndex = -1;
for (let i = startIndex + startMarker.length - 1; i < inputPanelContent.length; i++) {
  if (inputPanelContent[i] === '{') openBraces++;
  if (inputPanelContent[i] === '}') {
    openBraces--;
    if (openBraces === 0) {
      endIndex = i + 1; // Include the closing brace
      // Check if there's a semicolon after
      if (inputPanelContent[endIndex] === ';') {
          endIndex++;
      }
      break;
    }
  }
}

if (endIndex === -1) {
  console.error("Could not find PREDEFINED_TEMPLATES end marker.");
  process.exit(1);
}

const newTemplatesDeclaration = `const PREDEFINED_TEMPLATES: Record<string, FormData> = ${templatesContent};`;

const newContent = inputPanelContent.substring(0, startIndex) + newTemplatesDeclaration + inputPanelContent.substring(endIndex);

fs.writeFileSync(inputPanelPath, newContent);
console.log("Successfully replaced PREDEFINED_TEMPLATES in InputPanel.tsx");
