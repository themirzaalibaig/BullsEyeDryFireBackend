#!/usr/bin/env node

/**
 * Script to remove comments from compiled JavaScript files in dist/
 * This helps reduce bundle size for production builds
 */

const fs = require('fs');
const path = require('path');
const stripComments = require('strip-comments');

const DIST_DIR = path.join(__dirname, '..', 'dist');

/**
 * Recursively process all JavaScript files in a directory
 */
function processDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`Directory ${dir} does not exist. Skipping...`);
    return;
  }

  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.js')) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        // Remove comments but preserve shebang and license comments
        const cleaned = stripComments(content, {
          preserveNewlines: true,
          block: true,
          line: true,
        });
        fs.writeFileSync(filePath, cleaned, 'utf8');
        console.log(`✓ Cleaned: ${path.relative(process.cwd(), filePath)}`);
      } catch (error) {
        console.error(`✗ Error processing ${filePath}:`, error.message);
      }
    }
  });
}

console.log('Starting comment removal from dist/ directory...\n');
processDirectory(DIST_DIR);
console.log('\n✓ Comment removal complete!');

