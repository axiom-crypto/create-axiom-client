import { execSync } from 'child_process';

export function scaffoldForge(path: string): void {
  // Clone the axiom-quickstart repository
  execSync(`git clone https://github.com/axiom-crypto/axiom-quickstart.git "${path}"`);

  // Navigate to the cloned directory
  process.chdir(path);

  // Delete the 'app' folder
  execSync('rm -rf app');
}
