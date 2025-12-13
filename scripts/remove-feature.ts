import fs from 'fs';
import path from 'path';
import readline from 'readline';

const name = process.argv[2];
if (!name) {
  console.error('❌ Error: Feature name is required');
  console.log('Usage: pnpm remove:feature <feature-name>');
  process.exit(1);
}

const root = path.join(process.cwd(), 'src', 'features', name);

if (!fs.existsSync(root)) {
  console.error(`❌ Error: Feature "${name}" does not exist`);
  process.exit(1);
}

// Confirm deletion
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(`⚠️  Are you sure you want to delete feature "${name}"? (yes/no): `, (answer: string) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    fs.rmSync(root, { recursive: true, force: true });
    console.log(`✅ Feature "${name}" removed successfully!`);
  } else {
    console.log('❌ Cancelled');
  }
  rl.close();
});
