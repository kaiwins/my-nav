import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// 把 dist/ 构建产物提交为 gh-pages 分支并推送(GitHub Pages 从该分支发布)
// 用法: npm run deploy

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const indexFile = join(root, ".git", "gh-pages-index");
const run = (cmd, opts = {}) => execSync(cmd, { cwd: root, stdio: "inherit", ...opts });

run("npm run build");

const env = { ...process.env, GIT_INDEX_FILE: indexFile };
const wtEnv = { ...env, GIT_WORK_TREE: join(root, "dist") };

execSync("git read-tree --empty", { cwd: root, env });
execSync("git add -A", { cwd: root, env: wtEnv });
const tree = execSync("git write-tree", { cwd: root, env }).toString().trim();
const message = `deploy: ${new Date().toISOString()}`;
const commit = execSync(`git commit-tree ${tree} -m "${message}"`, { cwd: root, env }).toString().trim();
execSync(`git update-ref refs/heads/gh-pages ${commit}`, { cwd: root, env });

run("git push origin gh-pages");
console.log("gh-pages branch updated.");
