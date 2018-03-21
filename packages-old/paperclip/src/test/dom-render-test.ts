import { FakeDocument, FakeAttribute, FakeDocumentFragment, FakeElement, FakeTextNode, stringifyNode } from "./utils";
import { patchDOM, patchNode2, diffNode, SlimParentNode, SlimElementAttribute, SlimCSSAtRule, SlimBaseNode, DOMNodeMap, renderDOM, setVMObjectIds, prepDiff, } from "slim-dom";
import { LoadDependencyGraphResult, runPCFile, loadModuleDependencyGraph } from "..";
import { expect } from "chai";

describe(__filename + "#", () => {
  [
    [`<a></a>`],
    [`<a b="1"></a>`],
    [`<a b="1">c</a>`],
    [`<a b="1"><c>d</c></a>`],
    [`<a></a>`, `<b></b>`],
    [`<a></a>`, `<b></b><a></a>`],
    [`<a></a><b></b>`, `<b></b><a></a>`],
    [`<a></a><b></b><c></c>`, `<b></b><c></c><a></a>`, `<c></c><d></d><a></a><b></b>`]
  ].forEach((variants) => {
    it(`can render and patch ${variants.join(" -> ")}`, async () => {
      let currDocument: SlimParentNode;
      const fakeDocument: FakeDocument = new FakeDocument();
      let fakeBody: FakeElement = fakeDocument.createElement("body");
      for (let i = 0, {length} = variants; i < length; i++) {
        const variant = variants[i];
        const { graph } = await loadModuleDependencyGraph("entry.pc", {
          readFile: () => Promise.resolve(wrapSource(variant))
        });
        const { document } = runPCFile({
          entry: {
            filePath: "entry.pc",
            componentId: "entry",
            previewName: "main"
          },
          graph
        });

        // if (currDocument) {
        //   const diff = prepDiff(currDocument, diffNode(currDocument, document));
        //   currDocument
        //   currDocument = patchNode(currDocument, diff);
        //   patchDOM(diff, document as SlimParentNode, {}, fakeBody as any);
        // } else {
        //   renderDOM(currDocument = document as SlimParentNode, fakeBody as any);
        // }
        // expect((fakeBody.childNodes[0] as FakeElement).shadowRoot.toString()).to.eql(variant);
      }
    });
  });
});

const wrapSource = (template: string) => `<component id="entry"><template>${template}</template><preview name="main"><entry /></preview></component>`;