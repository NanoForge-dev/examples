// Checks every example against the repository's rules. `node scripts/check.ts [--fix] [--list]`
// - shared code: a game file at `src/<path>` whose `<path>` is in `shared/<group>/` must be a
//   byte-identical copy (`--fix` copies the shared version over it);
// - one item per file: each file under `components/` or `systems/` (nested folders included)
//   exports one item (types, interfaces and enums next to it don't count), each file under
//   `scenes/` one scene.
// `--list` prints the example folders as JSON (the CI matrix).
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const GROUPS = ["basics", "demos", "games"];
const SKIP = new Set(["node_modules", "dist", ".nanoforge", "nf_modules"]);

/** `path` with `/` separators, whatever the OS. */
export const toPosix = (path: string): string => path.split(sep).join("/");

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    if (SKIP.has(name)) return [];
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const examples = (): string[] =>
  GROUPS.filter((group) => existsSync(join(ROOT, group))).flatMap((group) =>
    readdirSync(join(ROOT, group))
      .filter((name) => existsSync(join(ROOT, group, name, "package.json")))
      .map((name) => `${group}/${name}`),
  );

/** `shared/<group>/<path>` by `<path>`; a path in two groups is an error. */
const sharedFiles = (errors: string[]): Map<string, string> => {
  const files = new Map<string, string>();
  for (const file of walk(join(ROOT, "shared"))) {
    const path = toPosix(relative(join(ROOT, "shared"), file))
      .split("/")
      .slice(1)
      .join("/");
    const other = files.get(path);
    if (other) errors.push(`shared: ${path} is in two groups (${toPosix(relative(ROOT, other))})`);
    files.set(path, file);
  }
  return files;
};

// An exported value: `export [default] [abstract|async] class|function|const|let|var`, a bare
// `export default`, or `export *`. Types, interfaces and enums describe the item: not counted.
const ITEM =
  /^export (?:default\b|\*|(?:(?:abstract|async) )*(?:class|function|const|let|var)\b)/gm;
// `export { a, b as c }` (and `export { a } from "…"`): one item per name not marked `type`.
const LIST = /^export \{([^}]*)\}/gm;
const SCENE = /^export (?:default )?class \w+ extends /gm;

/** Exported values of a module's text. */
export const countItems = (text: string): number =>
  (text.match(ITEM)?.length ?? 0) +
  [...text.matchAll(LIST)].reduce(
    (sum, [, names]) =>
      sum + names.split(",").filter((name) => name.trim() && !/^\s*type\s/.test(name)).length,
    0,
  );

/** Scene classes of a module's text. */
export const countScenes = (text: string): number => text.match(SCENE)?.length ?? 0;

/** The folder kind of `src/<path>`: its nearest `components`, `systems` or `scenes` folder. */
export const kindOf = (path: string): string | undefined =>
  path
    .split("/")
    .slice(0, -1)
    .findLast((folder) => folder === "components" || folder === "systems" || folder === "scenes");

/** Checks every example; with `fix`, copies each drifted shared file and lists it in `fixed`. */
export const check = (fix = false): { errors: string[]; fixed: string[] } => {
  const errors: string[] = [];
  const fixed: string[] = [];
  const shared = sharedFiles(errors);
  for (const example of examples()) {
    for (const file of walk(join(ROOT, example))) {
      const path = toPosix(relative(join(ROOT, example), file));
      const inSrc = /(?:^|\/)src\/(.+)$/.exec(path)?.[1];
      if (!inSrc) continue;
      const text = readFileSync(file, "utf8");
      const source = shared.get(inSrc);
      const copy = source && readFileSync(source, "utf8");
      const from = source && toPosix(relative(ROOT, source));
      if (copy && copy !== text) {
        if (fix) {
          writeFileSync(file, copy);
          fixed.push(`${example}/${path}: overwritten with ${from}`);
        } else errors.push(`${example}/${path}: differs from ${from} (run with --fix)`);
      }
      const checked = copy && fix ? copy : text;
      const kind = kindOf(inSrc);
      if (kind === "components" || kind === "systems") {
        const count = countItems(checked);
        if (count !== 1) errors.push(`${example}/${path}: ${count} exported items, one expected`);
      }
      if (kind === "scenes") {
        const count = countScenes(checked);
        if (count !== 1) errors.push(`${example}/${path}: ${count} scenes, one expected`);
      }
    }
  }
  return { errors, fixed };
};

if (import.meta.main) {
  if (process.argv.includes("--list")) {
    console.log(JSON.stringify(examples()));
  } else {
    const { errors, fixed } = check(process.argv.includes("--fix"));
    for (const file of fixed) console.log(file);
    for (const error of errors) console.error(error);
    if (errors.length) process.exit(1);
    console.log(`${examples().length} examples checked.`);
  }
}
