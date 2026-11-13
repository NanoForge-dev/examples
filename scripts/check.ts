// Checks every example against the repository's rules. `node scripts/check.ts [--fix] [--list]`
// - shared code: a game file at `src/<path>` whose `<path>` is in `shared/<group>/` must be a
//   byte-identical copy (`--fix` copies the shared version over it);
// - one item per file: each file of `components/` and `systems/` exports one item, each file of
//   `scenes/` one scene.
// `--list` prints the example folders as JSON (the CI matrix).
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const GROUPS = ["basics", "demos", "games"];
const SKIP = new Set(["node_modules", "dist", ".nanoforge", "nf_modules"]);

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
    const path = relative(join(ROOT, "shared"), file).split("/").slice(1).join("/");
    const other = files.get(path);
    if (other) errors.push(`shared: ${path} is in two groups (${relative(ROOT, other)})`);
    files.set(path, file);
  }
  return files;
};

const ITEM = /^export (?:abstract )?(?:class|const|function) /gm;
const SCENE = /^export class \w+ extends /gm;

export const check = (fix = false): string[] => {
  const errors: string[] = [];
  const shared = sharedFiles(errors);
  for (const example of examples()) {
    for (const file of walk(join(ROOT, example))) {
      const path = relative(join(ROOT, example), file);
      const inSrc = /(?:^|\/)src\/(.+)$/.exec(path)?.[1];
      if (!inSrc) continue;
      const text = readFileSync(file, "utf8");
      const source = shared.get(inSrc);
      if (source && readFileSync(source, "utf8") !== text) {
        if (fix) writeFileSync(file, readFileSync(source, "utf8"));
        else
          errors.push(
            `${example}/${path}: differs from ${relative(ROOT, source)} (run with --fix)`,
          );
      }
      const folder = inSrc.split("/").at(-2);
      if (folder === "components" || folder === "systems") {
        const count = text.match(ITEM)?.length ?? 0;
        if (count !== 1) errors.push(`${example}/${path}: ${count} exported items, one expected`);
      }
      if (folder === "scenes") {
        const count = text.match(SCENE)?.length ?? 0;
        if (count !== 1) errors.push(`${example}/${path}: ${count} scenes, one expected`);
      }
    }
  }
  return errors;
};

if (import.meta.main) {
  if (process.argv.includes("--list")) {
    console.log(JSON.stringify(examples()));
  } else {
    const errors = check(process.argv.includes("--fix"));
    for (const error of errors) console.error(error);
    if (errors.length) process.exit(1);
    console.log(`${examples().length} examples checked.`);
  }
}
