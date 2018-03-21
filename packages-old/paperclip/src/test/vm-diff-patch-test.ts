// TODO - css diff / patch
import { diffNode, SlimParentNode, patchNode2, SlimElement, prepDiff } from "slim-dom";
import { expect } from "chai";
import { loadModuleDependencyGraph, runPCFile, PCElement } from "..";
import { stringifyNode, FakeDocument } from "./utils";

describe(__filename + "#", () => {
  [
    [`a`, `b`, [
      {
        "type": "SET_TEXT_NODE_VALUE",
        "target": [0, "shadow", 0],
        "newValue": "b"
      }
    ]],
    [`<a />`, `<b />`, [
      {
        "type": "REMOVE_CHILD_NODE",
        "target": [0, "shadow"],
        "child": null,
        "index": 0
      },
      {
        "type": "INSERT_CHILD_NODE",
        "target": [0, "shadow"],
        "child": [
          [
            "entry.pc"
          ],
          [
            0,
            "b",
            [],
            null,
            []
          ]
        ],
        "clone": undefined,
        "index": 0
      }
    ]],
    [`<a b />`, `<a c />`, [
      {
        "type": "REMOVE_ATTRIBUTE",
        "target": [0, "shadow", 0],
        "name": "b",
        "newValue": null,
        "oldValue": null,
        "oldName": null,
        "index": 0
      },
      {
        "type": "INSERT_ATTRIBUTE",
        "target": [0, "shadow", 0],
        "name": "c",
        "newValue": true,
        "oldValue": null,
        "oldName": null,
        "index": 0
      }
    ]],
    [`<a b="1" />`, `<a b="2" />`, [
      {
        "type": "SET_ATTRIBUTE",
        "target": [0, "shadow", 0],
        "name": "b",
        "newValue": "2",
        "oldName": null,
        "oldValue": null,
        "index": 0
      }
    ]],
    [`<a b="1" />`, `<a b="2" />`, [
      {
        "type": "SET_ATTRIBUTE",
        "target": [0, "shadow", 0],
        "name": "b",
        "newValue": "2",
        "oldName": null,
        "oldValue": null,
        "index": 0
      }
    ]]
  ].forEach(([oldSource, newSource, expectedDiffs]: any) => {
    it(`can diff ${oldSource} against ${newSource}`, async () => {
      const { graph: ag } = await loadModuleDependencyGraph("entry.pc", {
        readFile: () => Promise.resolve(wrapSource(oldSource))
      });
      const { graph: bg } =  await loadModuleDependencyGraph("entry.pc", {
        readFile: () => Promise.resolve(wrapSource(newSource))
      });

      const { document: an } = runPCFile({ entry: {filePath: "entry.pc", componentId: "entry", previewName: "main" }, graph: ag });

      const { document: bn, diagnostics } = runPCFile({ entry: {filePath: "entry.pc", componentId: "entry", previewName: "main" }, graph: bg });

      const diffs = diffNode(an, bn);
      expect(diffs).to.eql(expectedDiffs);
    });
  });

  [
    [`a`, `b`, `c`],
    [`<a></a>`, `<b></b>`],
    [`<a b="true"></a>`, `<a c="true"></a>`],
    [`<a b="1"></a>`, `<a b="2"></a>`],
    [`<a b="1" c="1"></a>`, `<a b="1" c="1"></a>`],
    [`<a b="1"></a>`, `<a c="1" b="1"></a>`],
    [`<style>.a {}</style>`, `<style>.b {}</style>`],
    [`<style>.a {a: 1;}</style>`, `<style>.a {a: 2;}</style>`],
    [`<style>.a {a: 1;}</style>`, `<style>.a {b: 1;}</style>`],
    [`<style>.a {a: 1;}</style>`, `<style>.a {} .b {}</style>`],
    [`<style>.a {a: 1;} .b {a:2;}</style>`, `<style>.a {}</style>`],
    [`<a></a><b></b>`, `<b></b><a></a>`, `<a></a><b></b>`],
    [`<a></a><b></b><c></c>`, `<c></c><a></a><b></b>`, `<b></b><a></a><c></c>`],
    [`<a b="1" c="1" d="1"></a>`, `<a c="1" b="1" d="1"></a>`, `<a d="1" b="1" c="1"></a>`],
    [`<style>.a {} .b {}</style>`, `<style>.b {} .a {}</style>`],
    [`<style>@media a {}</style>`, `<style>@media b {}</style>`],
    [`<style>@media screen and (max-width: 100px) {}</style>`, `<style>@media screen and (max-width: 200px) {}</style>`],
    [`<style>@media a {.b {color: red;}}</style>`, `<style>@media a {.b {color: blue;}}</style>`],
    [`<style>@media a {.b {color: red;}}</style>`, `<style>@media a {.b {color: blue;}.c {color: red;}}</style>`],
    [`<style>@keyframes a {}</style>`, `<style>@keyframes b {}</style>`],
    [`<style>@unknown a {}</style>`, `<style>@unknown b {}</style>`],
    [`<div>a</div>`, `<style>@unknown b {}</style><div>a</div>`],
    [`<style>.a { color: red; }</style>`, `<style>.a { color: red; background: blue; }</style>`],
  ].forEach((variants) => {
    it(`can diff and patch ${variants.join(" -> ")}`, async () => {
      let prevDocument: SlimParentNode;
      
      for (const variant of variants) {
        const { graph } = await loadModuleDependencyGraph("entry.pc", {
          readFile: () => Promise.resolve(wrapSource(variant))
        });
        const { document } = runPCFile({ entry: { filePath: "entry.pc", componentId: "entry", previewName: "main" }, graph });

        if (prevDocument) {
          const diffs = prepDiff(prevDocument, diffNode(prevDocument, document));
          prevDocument = diffs.reduce((doc, mutation) => patchNode2(mutation, doc), prevDocument);
        } else {          
          prevDocument = document as SlimParentNode;
        }
        
        expect(stringifyNode(prevDocument)).to.eql(stringifyNode(document));
      }
    })
  });

});

const wrapSource = (template: string) => `<component id="entry"><template>${template}</template><preview name="main"><entry /></preview></component>`;