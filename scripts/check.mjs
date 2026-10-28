import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

function ok(message) {
  console.log(`ok  ${message}`);
}

function fail(message) {
  failures.push(message);
  console.log(`fail ${message}`);
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8").replace(/\r\n/g, "\n");
}

function inside(parent, child) {
  const rel = path.relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(abs, out);
    else out.push(abs);
  }
  return out;
}

// A reader for the YAML these files use: nested maps, lists, scalars, and
// folded or literal blocks. It reports a line it cannot read, so a broken
// file fails the check. It does not cover all of YAML.
function parseYaml(text, label) {
  const lines = text.split("\n");
  const problems = [];
  const root = {};
  const stack = [{ indent: -1, node: root }];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "" || /^\s*#/.test(line)) {
      i += 1;
      continue;
    }
    if (/\t/.test(line.match(/^\s*/)[0])) {
      problems.push(`${label}:${i + 1}: tab in indentation`);
      i += 1;
      continue;
    }
    const indent = line.match(/^ */)[0].length;
    const body = line.trim();
    // A list may sit at the same indent as the key that owns it.
    const isItem = /^-(\s|$)/.test(body);
    while (stack.length > 1 && (isItem ? indent < stack[stack.length - 1].indent : indent <= stack[stack.length - 1].indent)) {
      stack.pop();
    }
    const parent = stack[stack.length - 1].node;
    const item = /^-(?:\s+(.*))?$/.exec(body);
    if (item) {
      if (!Array.isArray(parent)) {
        problems.push(`${label}:${i + 1}: list item outside a list`);
      } else {
        parent.push(item[1] ?? "");
      }
      i += 1;
      continue;
    }
    const pair = /^([A-Za-z_][\w-]*):(?:\s+(.*))?$/.exec(body);
    if (!pair || Array.isArray(parent)) {
      problems.push(`${label}:${i + 1}: cannot read line`);
      i += 1;
      continue;
    }
    const [, key, rest = ""] = pair;
    if (Object.hasOwn(parent, key)) problems.push(`${label}:${i + 1}: duplicate key ${key}`);
    if (/^[>|][+-]?$/.test(rest)) {
      const block = [];
      i += 1;
      while (i < lines.length && (lines[i].trim() === "" || lines[i].match(/^ */)[0].length > indent)) {
        block.push(lines[i].trim());
        i += 1;
      }
      parent[key] = block.join(" ").trim();
      continue;
    }
    if (rest === "") {
      let j = i + 1;
      while (j < lines.length && (lines[j].trim() === "" || /^\s*#/.test(lines[j]))) j += 1;
      const next = j < lines.length ? lines[j] : "";
      const nextIndent = next.match(/^ */)[0].length;
      if (next.trim() !== "" && nextIndent >= indent && (nextIndent > indent || /^\s*-(\s|$)/.test(next))) {
        const child = /^\s*-(\s|$)/.test(next) ? [] : {};
        parent[key] = child;
        stack.push({ indent, node: child });
      } else {
        parent[key] = "";
      }
      i += 1;
      continue;
    }
    if (/^["'][^]*$/.test(rest) && !/^(["'])[^]*\1$/.test(rest) ) {
      // A quoted scalar that wraps onto the following lines.
      let value = rest;
      i += 1;
      while (i < lines.length && !/["']\s*$/.test(value)) {
        value += ` ${lines[i].trim()}`;
        i += 1;
      }
      parent[key] = value.replace(/^["']|["']$/g, "");
      continue;
    }
    // A plain scalar may continue on more deeply indented lines.
    let value = rest;
    i += 1;
    while (i < lines.length && lines[i].trim() !== "" && lines[i].match(/^ */)[0].length > indent) {
      if (/:(\s|$)/.test(lines[i].trim())) problems.push(`${label}:${i + 1}: key after a scalar value`);
      value += ` ${lines[i].trim()}`;
      i += 1;
    }
    if (/^[[{]/.test(value)) {
      const bare = value.replace(/"[^"]*"|'[^']*'/g, "");
      const count = (chars) => [...bare].filter((c) => chars.includes(c)).length;
      if (count("[") !== count("]") || count("{") !== count("}")) problems.push(`${label}:${i}: unbalanced bracket`);
    }
    parent[key] = value.replace(/^["']|["']$/g, "");
  }
  return { value: root, problems };
}

// SKILL.md: frontmatter, name, trigger phrases.
const skillRel = "skills/socrates/SKILL.md";
const skillMd = read(skillRel);
let frontmatter = null;
if (!skillMd.startsWith("---\n")) {
  fail("SKILL.md: missing opening ---");
} else {
  const end = skillMd.indexOf("\n---\n", 4);
  if (end === -1) fail("SKILL.md: frontmatter not closed");
  else frontmatter = skillMd.slice(4, end);
}

if (frontmatter !== null) {
  const parsed = parseYaml(frontmatter, "SKILL.md frontmatter");
  parsed.problems.forEach(fail);
  if (parsed.problems.length === 0) ok("SKILL.md frontmatter parses as YAML");
  const { name, description } = parsed.value;
  if (name !== "socrates") fail(`SKILL.md: name is ${name}`);
  else ok("SKILL.md frontmatter name=socrates");
  if (typeof description !== "string" || !description) {
    fail("SKILL.md: frontmatter missing description");
  } else {
    const triggers = ["Socrates", "/socrates", "Socrates this", "grill me", "question me", "poke holes"];
    const missing = triggers.filter((phrase) => !description.includes(phrase));
    if (missing.length) fail(`SKILL.md description missing: ${missing.join(", ")}`);
    else ok("SKILL.md description includes the trigger phrases");
  }
}

// Every reference the skill links exists, and the four references are linked.
const skillDir = path.join(root, "skills/socrates");
const linkRe = /\[[^\]]*\]\(([^)\s]+)\)/g;
const linked = new Set();
const markdownFiles = [...walk(path.join(root, "skills")).filter((file) => file.endsWith(".md")), path.join(root, "README.md")];
let linkFailures = 0;
for (const file of markdownFiles) {
  for (const match of fs.readFileSync(file, "utf8").matchAll(linkRe)) {
    const target = match[1];
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    const resolved = path.resolve(path.dirname(file), target);
    if (!inside(root, resolved) || !fs.existsSync(resolved)) {
      linkFailures += 1;
      fail(`missing link ${path.relative(root, file)} -> ${target}`);
      continue;
    }
    if (file === path.join(root, skillRel)) linked.add(resolved);
  }
}
if (linkFailures === 0) ok("relative links in skills/ and README.md resolve");
for (const rel of ["software", "research", "agent-execution", "coordination"].map((n) => `references/${n}.md`)) {
  if (!linked.has(path.resolve(skillDir, rel))) fail(`SKILL.md does not link ${rel}`);
  else ok(`SKILL.md links ${rel}`);
}

// Skill metadata and assets.
const openaiRel = "skills/socrates/agents/openai.yaml";
const openai = parseYaml(read(openaiRel), openaiRel);
openai.problems.forEach(fail);
if (openai.problems.length === 0) ok(`${openaiRel} parses as YAML`);
const iface = openai.value.interface ?? {};
for (const key of ["display_name", "short_description", "default_prompt"]) {
  if (!iface[key]) fail(`${openaiRel}: interface.${key} missing`);
}
for (const key of ["icon_small", "icon_large"]) {
  const target = iface[key];
  if (!target) fail(`${openaiRel}: interface.${key} missing`);
  else if (!fs.existsSync(path.resolve(skillDir, target))) fail(`${openaiRel}: ${key} ${target} does not exist`);
  else ok(`${openaiRel}: ${key} exists`);
}
if (typeof iface.default_prompt === "string" && !iface.default_prompt.includes("$socrates")) {
  fail(`${openaiRel}: default_prompt does not mention $socrates`);
}

// Eval cases are well formed. This does not call a model.
const evalRoot = path.join(root, "evals");
const caseDirs = fs.readdirSync(evalRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory());
if (caseDirs.length === 0) fail("evals/ has no cases");
for (const dir of caseDirs) {
  const rel = path.join("evals", dir.name, "case.yaml");
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    fail(`${dir.name}: missing case.yaml`);
    continue;
  }
  const before = failures.length;
  const parsed = parseYaml(read(rel), rel);
  parsed.problems.forEach(fail);
  const { name, prompt, expect, fixture, reply } = parsed.value;
  if (!name) fail(`${rel}: missing name`);
  else if (name !== dir.name) fail(`${rel}: name ${name} does not match folder ${dir.name}`);
  if (!prompt) fail(`${rel}: missing prompt`);
  if (!expect || typeof expect !== "object" || Object.keys(expect).length === 0) fail(`${rel}: missing expect`);
  if (reply !== undefined && !reply) fail(`${rel}: reply is empty`);
  if (fixture !== undefined) {
    const fixturePath = path.resolve(path.dirname(abs), fixture);
    if (!fixture || !inside(root, fixturePath) || !fs.existsSync(fixturePath)) {
      fail(`${rel}: fixture ${fixture} does not exist`);
    }
  }
  if (failures.length === before) ok(rel);
}

// README and package.
const readme = read("README.md");
if (!readme.includes("https://github.com/ignore-previous/socrates.git")) fail("README.md does not show the clone command");
else ok("README.md shows the clone command");

const pkg = JSON.parse(read("package.json"));
if (pkg.scripts?.check !== "node scripts/check.mjs") fail("package.json scripts.check is not node scripts/check.mjs");
else ok("package.json scripts.check");
for (const field of ["dependencies", "devDependencies"]) {
  if (pkg[field] && Object.keys(pkg[field]).length > 0) fail(`package.json has ${field}`);
}
if (!failures.some((item) => item.startsWith("package.json has"))) ok("package.json has no dependencies");
if (!(pkg.files ?? []).includes("skills/")) fail("package.json files does not include skills/");
else ok("package.json files includes skills/");

// Claude Code plugin and marketplace files, and the version they share with package.json.
function readJson(rel) {
  try {
    return JSON.parse(read(rel));
  } catch (error) {
    fail(`${rel}: ${error.message}`);
    return null;
  }
}
const kebab = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const semver = /^\d+\.\d+\.\d+$/;
const pluginRel = ".claude-plugin/plugin.json";
const marketplaceRel = ".claude-plugin/marketplace.json";
const plugin = readJson(pluginRel);
const marketplace = readJson(marketplaceRel);
const jsonBefore = failures.length;
if (plugin) {
  if (!kebab.test(plugin.name ?? "")) fail(`${pluginRel}: name is not kebab-case`);
  if (plugin.name !== "socrates") fail(`${pluginRel}: name is ${plugin.name}, not socrates`);
  if (!semver.test(plugin.version ?? "")) fail(`${pluginRel}: version is not x.y.z`);
  else if (plugin.version !== pkg.version) fail(`${pluginRel}: version ${plugin.version} differs from package.json ${pkg.version}`);
  for (const field of ["description", "license", "homepage", "repository"]) {
    if (typeof plugin[field] !== "string" || !plugin[field]) fail(`${pluginRel}: ${field} missing`);
  }
  if (!plugin.author?.name) fail(`${pluginRel}: author.name missing`);
  if (plugin.license !== pkg.license) fail(`${pluginRel}: license differs from package.json`);
}
if (marketplace) {
  if (!kebab.test(marketplace.name ?? "")) fail(`${marketplaceRel}: name is not kebab-case`);
  if (!marketplace.owner?.name) fail(`${marketplaceRel}: owner.name missing`);
  const entries = Array.isArray(marketplace.plugins) ? marketplace.plugins : [];
  if (entries.length !== 1) fail(`${marketplaceRel}: expected exactly one plugin entry, found ${entries.length}`);
  const entry = entries[0] ?? {};
  if (entry.name !== plugin?.name) fail(`${marketplaceRel}: entry name ${entry.name} differs from ${pluginRel} name`);
  if (entry.version !== pkg.version) fail(`${marketplaceRel}: entry version ${entry.version} differs from package.json ${pkg.version}`);
  if (entry.source !== "./") fail(`${marketplaceRel}: entry source must be "./" (the repo root)`);
}
if (!fs.existsSync(path.join(root, "skills/socrates/SKILL.md"))) fail("plugin root has no skills/socrates/SKILL.md");
if (!readme.includes("/plugin marketplace add ignore-previous/socrates")) fail("README.md does not show the marketplace add command");
if (plugin && marketplace && failures.length === jsonBefore) ok("plugin and marketplace JSON are valid and share version " + pkg.version);

// Line endings stay LF.
const gitattributes = fs.existsSync(path.join(root, ".gitattributes")) ? read(".gitattributes") : "";
if (!/^\* text=auto eol=lf$/m.test(gitattributes) || !/^skills\/\*\* -text$/m.test(gitattributes)) {
  fail(".gitattributes must hold '* text=auto eol=lf' and 'skills/** -text'");
} else {
  ok(".gitattributes keeps LF and leaves skills/ byte-for-byte");
}
for (const rel of ["scripts/check.mjs", "package.json", "README.md", ".gitattributes", pluginRel, marketplaceRel]) {
  if (fs.existsSync(path.join(root, rel)) && fs.readFileSync(path.join(root, rel), "utf8").includes("\r")) fail(`${rel}: has CRLF line endings`);
}

// No home paths or work-queue ids anywhere in the branch.
const pathNeedles = ["~" + "/", "/" + "home" + "/", "/" + "Users" + "/"];
const queueId = /\bwq[-_ ]?[A-Za-z0-9]{2,}\b/;
const issueId = new RegExp("\\b(?:HU" + "B|MV" + "P)-\\d+\\b");
// With --maintainer (npm run check:maintainer), commit authors and committers
// must match one of these name and email pairs exactly, so neither a personal
// name nor a personal email can slip in. Contributors run the plain check.
const maintainer = process.argv.includes("--maintainer");
const allowedIdentities = [
  "ruddy-dev <345788022+ruddy-dev@users.noreply.github.com>",
  "GitHub <noreply@github.com>",
];
let privateHits = 0;
function scanPrivate(text, label) {
  text.split("\n").forEach((line, index) => {
    for (const needle of pathNeedles) {
      if (line.includes(needle)) {
        privateHits += 1;
        fail(`${label}:${index + 1}: home path`);
      }
    }
    if (issueId.test(line)) {
      privateHits += 1;
      fail(`${label}:${index + 1}: issue id`);
    }
    if (queueId.test(line)) {
      privateHits += 1;
      fail(`${label}:${index + 1}: work-queue id`);
    }
  });
}
for (const abs of walk(root)) {
  const rel = path.relative(root, abs);
  if (rel === "LICENSE" || rel.endsWith(".svg") || rel.endsWith(".png")) continue;
  scanPrivate(fs.readFileSync(abs, "utf8"), rel);
}
let branchLog = "";
try {
  branchLog = execFileSync("git", ["log", "origin/main..HEAD", "--format=%H%n%s%n%b%n%an %ae%n%cn %ce"], { cwd: root, encoding: "utf8" });
  if (maintainer) {
    const identities = execFileSync("git", ["log", "origin/main..HEAD", "--format=%an <%ae>%n%cn <%ce>"], { cwd: root, encoding: "utf8" });
    for (const identity of new Set(identities.split("\n").filter(Boolean))) {
      if (!allowedIdentities.includes(identity)) fail(`commit author or committer "${identity}" is not an allowed identity`);
    }
  }
} catch {
  fail("cannot read git log origin/main..HEAD (fetch origin first)");
}
scanPrivate(branchLog, "commit message");
if (privateHits === 0) ok("no home paths or queue ids in branch files or branch commit messages");

if (failures.length) {
  console.log(`socrates check: fail (${failures.length})`);
  process.exit(1);
}
console.log("socrates check: pass");
