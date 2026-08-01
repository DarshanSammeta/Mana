const fs = require('fs');
const content = fs.readFileSync('C:/ReactProjects/ManaEventWebApp/src/app/vendor/settings/page.tsx', 'utf8');

const tags = [];
const regex = /<(\/?[a-zA-Z0-9]+)(\s|>)/g;
let match;

while ((match = regex.exec(content)) !== null) {
    const tag = match[1];
    if (tag.startsWith('/')) {
        const last = tags.pop();
        if (last !== tag.substring(1)) {
            console.log(`Mismatch: expected </${last}> but found <${tag}>`);
        }
    } else {
        // Simple check for self-closing tags
        const fullTag = content.substring(match.index, content.indexOf('>', match.index) + 1);
        if (!fullTag.endsWith('/>')) {
            tags.push(tag);
        }
    }
}

console.log('Unclosed tags:', tags);
