
const fs = require('fs');
const path = require('path');

const directories = ['src/app/vendor', 'src/app/admin'];

function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(file));
        } else if (file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const allFiles = directories.flatMap(dir => getFiles(dir));

const results = [];

allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');

    // Find all imported names from lucide-react
    const lucideImportMatch = content.match(/import\s*{([^}]+)}\s*from\s*["']lucide-react["']/);
    const importedIcons = new Set();
    if (lucideImportMatch) {
        lucideImportMatch[1].split(',').forEach(s => {
            const part = s.trim();
            if (!part) return;
            const renameMatch = part.match(/(\w+)\s+as\s+(\w+)/);
            if (renameMatch) {
                importedIcons.add(renameMatch[2]);
            } else {
                importedIcons.add(part);
            }
        });
    }

    // Find all JSX-like tags <Name
    const tags = new Set();
    const tagMatch = content.match(/<([A-Z][a-zA-Z0-9]*)/g);
    if (tagMatch) {
        tagMatch.forEach(t => tags.add(t.substring(1)));
    }

    // Identify gaps (used in JSX but not imported from lucide-react AND not imported from elsewhere AND not defined locally)
    const gaps = [];
    tags.forEach(tag => {
        // Simple heuristic: if it's a common Lucide icon name but not imported
        // We check if it's imported from ANYWHERE
        const isImported = content.includes(`import { ${tag}`) ||
                           content.includes(`import ${tag}`) ||
                           content.includes(`import { ...${tag}`) ||
                           content.includes(`as ${tag}`) ||
                           content.match(new RegExp(`const\\s+${tag}\\s*=`)) ||
                           content.match(new RegExp(`function\\s+${tag}\\s*\\(`)) ||
                           content.match(new RegExp(`interface\\s+${tag}`)) ||
                           content.match(new RegExp(`type\\s+${tag}`)) ||
                           // Check specifically for the lucide-react import block we already parsed
                           importedIcons.has(tag);

        if (!isImported) {
            // Check if it's a known Lucide icon name (this is a bit of a guess, but if it starts with < and isn't imported, it's likely a bug)
            // To be more precise, let's just report everything that looks like a component but isn't imported or defined.
            // We ignore common Next.js/React components if we can.
            if (['Link', 'Image', 'Button', 'Input', 'Card', 'Badge', 'Tabs', 'Table', 'Skeleton', 'EmptyState'].includes(tag)) return;

            // Filter out things that are likely generic types like T or K or used in generics
            if (content.match(new RegExp(`<${tag}\\[\\]>`)) || content.match(new RegExp(`useState<${tag}`))) return;

            gaps.push(tag);
        }
    });

    if (gaps.length > 0) {
        results.push({ file, gaps });
    }
});

console.log(JSON.stringify(results, null, 2));
