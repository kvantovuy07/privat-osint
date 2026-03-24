import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

const repairs = [
  {
    name: "effect",
    version: "3.18.4",
    requiredFile: path.join(root, "node_modules/effect/dist/cjs/Arbitrary.js"),
    targetDir: path.join(root, "node_modules/effect"),
  },
  {
    name: "fast-check",
    version: "3.23.2",
    requiredFile: path.join(root, "node_modules/fast-check/lib/check/precondition/Pre.js"),
    targetDir: path.join(root, "node_modules/fast-check"),
  },
];

for (const repair of repairs) {
  if (existsSync(repair.requiredFile)) {
    continue;
  }

  const tarballUrl = `https://registry.npmjs.org/${repair.name}/-/${repair.name}-${repair.version}.tgz`;
  const command = [
    "tmpdir=$(mktemp -d)",
    `curl -Ls ${tarballUrl} | tar -xz -C "$tmpdir"`,
    `rsync -a "$tmpdir/package/" "${repair.targetDir}/"`,
    'rm -rf "$tmpdir"',
  ].join(" && ");

  console.log(`Repairing ${repair.name}@${repair.version}`);
  execSync(command, { stdio: "inherit", shell: "/bin/zsh" });
}
