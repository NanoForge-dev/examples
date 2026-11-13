// Self-test of the check's parsing: `node --test scripts/check.test.ts`.
import assert from "node:assert/strict";
import { sep } from "node:path";
import { test } from "node:test";

import { countItems, countScenes, kindOf, toPosix } from "./check.ts";

test("countItems counts every exported value", () => {
  assert.equal(countItems("export class A {}"), 1);
  assert.equal(countItems("export abstract class A {}"), 1);
  assert.equal(countItems("export default class A {}"), 1);
  assert.equal(countItems("export const a = () => {};"), 1);
  assert.equal(countItems("export let a = 1;"), 1);
  assert.equal(countItems("export function a() {}"), 1);
  assert.equal(countItems("export async function a() {}"), 1);
  assert.equal(countItems("export default a;"), 1);
  assert.equal(countItems('export * from "./a";'), 1);
  assert.equal(countItems("const a = 1;\nconst b = 2;\nexport { a, b as c };"), 2);
  assert.equal(countItems('export { a, type B } from "./a";'), 1);
  assert.equal(countItems("export class A {}\nexport const b = 1;"), 2);
  assert.equal(countItems("const a = 1;"), 0);
});

test("countItems leaves out types, interfaces and enums", () => {
  const text = [
    "export type T = string;",
    "export interface I {}",
    "export enum E { A }",
    "export type { U };",
    "export class A {}",
  ].join("\n");
  assert.equal(countItems(text), 1);
});

test("countScenes counts scene classes", () => {
  assert.equal(countScenes("export class Menu extends EcsScene {}"), 1);
  assert.equal(countScenes("export default class Menu extends EcsScene {}"), 1);
  assert.equal(countScenes("export class Menu {}"), 0);
});

test("kindOf finds the nearest kind folder, nested or not", () => {
  assert.equal(kindOf("components/ball.component.ts"), "components");
  assert.equal(kindOf("systems/ui/draw-menu.system.ts"), "systems");
  assert.equal(kindOf("scenes/menu.scene.ts"), "scenes");
  assert.equal(kindOf("main.ts"), undefined);
  assert.equal(kindOf("components.ts"), undefined);
});

test("toPosix turns the OS separator into /", () => {
  assert.equal(toPosix(["src", "components", "a.ts"].join(sep)), "src/components/a.ts");
});
