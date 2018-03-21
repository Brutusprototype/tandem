import { expect } from "chai";
import { runPCFile, loadModuleDependencyGraph, ComponentModule } from "..";
import { FakeAttribute, FakeDocument, FakeDocumentFragment, FakeElement, FakeTextNode, generateRandomStyleSheet, generateRandomComponents } from "./utils";
import { renderDOM2, SlimParentNode, diffNode, patchNode2, patchDOM2, DOMNodeMap, setVMObjectIds, prepDiff, NativeObjectMap } from "slim-dom";

describe(__filename + "#", () => {
  it(`can render a component with a template`, async () => {
    const document = new FakeDocument();
    const body = document.createElement("body");
    const slimDoc = await runPCComponent({
      "entry.pc": `
        <component id="test">
          <template>
            <span>hello</span>
          </template>
          <preview name="main">
            <test />
          </preview>
        </component>
      `
    });
    renderDOM2(slimDoc, body as any);
    expect(body.toString()).to.eql(`<body><test class="__test_scope_host"><span class="__test_scope">hello</span></test></body>`);
  });

  it(`can render a component that has a slot and no child nodes`, async () => {
    const document = new FakeDocument();
    const body = document.createElement("body");
    const slimDoc = await runPCComponent({
      "entry.pc": `
        <component id="test">
          <template>
            <span><slot></slot></span>
          </template>
          <preview name="main">
            <test /><slot />
          </preview>
        </component>
      `
    });
    renderDOM2(slimDoc, body as any);
    expect(body.toString()).to.eql(`<body><test class="__test_scope_host"><span class="__test_scope"><!--section-start--><!--section-end--></span></test><!--section-start--><!--section-end--></body>`);
  });

  it(`can render a component with default slot children`, async () => {
    const document = new FakeDocument();
    const body = document.createElement("body");
    const slimDoc = await runPCComponent({
      "entry.pc": `
        <component id="test">
          <template>
            <span><slot></slot></span>
          </template>
          <preview name="main">
            <test>a <b /> c</test>
          </preview>
        </component>
      `
    });
    renderDOM2(slimDoc, body as any);
    expect(body.toString()).to.eql(`<body><test class="__test_scope_host"><span class="__test_scope"><!--section-start-->a<b></b>c<!--section-end--></span></test></body>`);
  });

  it(`can render a component with named slots`, async () => {
    const document = new FakeDocument();
    const body = document.createElement("body");
    const slimDoc = await runPCComponent({
      "entry.pc": `
        <component id="test">
          <template>
            <span><slot></slot><slot name="a"></slot><slot name="b"></slot></span>
          </template>
          <preview name="main">
            <test>a <span slot="a">b</span><span slot="b">c</span><span slot="b">d</span>e</test>
          </preview>
        </component>
      `
    });
    renderDOM2(slimDoc, body as any);
    expect(body.toString()).to.eql(`<body><test class="__test_scope_host"><span class="__test_scope"><!--section-start-->ae<!--section-end--><!--section-start--><span slot="a">b</span><!--section-end--><!--section-start--><span slot="b">c</span><span slot="b">d</span><!--section-end--></span></test></body>`);
  });

  describe("diff/patch", () => {
    [
      [
        // slot testing
        // add slotted child
        `
          <component id="test">
            <template>
              <slot></slot>
            </template>
            <preview name="main">
              <test>
                <a /><b />
              </test>
            </preview>
          </component>
        `,
        `
          <component id="test">
            <template>
              <slot></slot>
            </template>
            <preview name="main">
              <test>
                <a /><b /><c />
              </test>
            </preview>
          </component>
        `
      ],

      [
        `
          <component id="test">
            <template>
              <slot name="test"></slot>
            </template>
            <preview name="main">
              <test>
                <a slot="test"></a>
              </test>
            </preview>
          </component>
        `,
        `
          <component id="test">
            <template>
              <slot name="test"></slot>
            </template>
            <preview name="main">
              <test>
                <a slot="test"></a>
                <a slot="test"></a>
              </test>
            </preview>
          </component>
        `
      ],

      [
        `
          <component id="test">
            <template>
              <slot name="test"></slot>
            </template>
            <preview name="main">
              <test>
                <b slot="test"></b>
                <c slot="test2"></c>
              </test>
            </preview>
          </component>
        `,
        `
          <component id="test">
            <template>
              <slot name="test2"></slot>
            </template>
            <preview name="main">
              <test>
                <b slot="test"></b>
                <c slot="test2"></c>
              </test>
            </preview>
          </component>
        `
      ],

      [
        `
          <component id="test">
            <template>
              <div>
                <slot></slot>
              </div>
            </template>
            <preview name="main">
              <test>a</test>
            </preview>
          </component>
        `,
        `
          <component id="test">
            <template>
              <span>
                <slot></slot>
              </span>
            </template>
            <preview name="main">
              <test>a</test>
            </preview>
          </component>
        `
      ],
      
      [
        `
          <component id="test">
            <template>
              <slot></slot>
            </template>
            <preview name="main">
              <test>
                a
                <span slot="test2">b</span>
                c
              </test>
            </preview>
          </component>
        `,
        `
          <component id="test">
            <template>
              <slot name="slot2"></slot>
              <slot></slot>
            </template>
            <preview name="main">
              <test>
                a
                <span slot="test2">b</span>
                c
              </test>
            </preview>
          </component>
        `
      ],

      // add named slotted child
      [
        `
          <component id="test">
            <template>
              <a />
            </template>
            <preview name="main">
              <test />
            </preview>
          </component>
        `,
        `
          <component id="test">
            <template>
              <b />
            </template>
            <preview name="main">
              <test />
            </preview>
          </component>
        `
      ],
      [
        `
          <component id="test">
            <template>
              <slot></slot>
            </template>
            <preview name="main">
              <test>
                a b
              </test>
            </preview>
          </component>
        `,
        `
          <component id="test">
            <template>
              <slot></slot>
            </template>
            <preview name="main">
              <test>
                b c
              </test>
            </preview>
          </component>
        `
      ],

      // busted fuzzy
      [
        `<component id="component0">
          <template>
            <slot name="b0"></slot>
          </template>
          <preview name="main">
            <component0 />
          </preview>
        </component>`,
        `<component id="component0">
          <template>
            <slot name="f0">hgdc</slot>
          </template>
          <preview name="main">
            <component0 />
          </preview>
        </component>`
      ],

      [
        `<component id="component0">
          <template>
            <i>jfkgcj</i>
          </template>
          <preview name="main">
            <component0 />
          </preview>
        </component>`,

        `<component id="component0">
          <template>
            <slot name="l0">
              gelcafel
              <k> ajkbea d</k>
            </slot>
            <slot name="l0">
              <e>iejdl</e>
            </slot>
          </template>
          <preview name="main">
            <component0></component0>
          </preview>
        </component>`,
      ],
      [
        `<component id="component0"><template><slot name="a0"></slot><c d="ik" e="h"></c><j c="ji" g="a"></j><slot name="a0"></slot><slot name="a0"></slot></template><preview name="main"><component0 a="j" i="dj"></component0></preview></component>`,

        `<component id="component0"><template><g i="j"></g><b h="l"></b><f b="ai" f="ie"></f><c b="eg" g="b"></c><l i="ke"></l><c f="e"></c><c d="jh" f="bc"></c><k d="a"></k><h d="ca"></h><g a="a" j="jf"></g></template><preview name="main"><component0 d="gi" f="f"></component0></preview></component> -> <component id="component0"><template><j k="ej" i="dl"></j><e c="kf"></e><j h="h" i="fb"></j><c f="cl" l="k"></c></template><preview name="main"><component0 c="ck" j="g"></component0></preview></component> -> <component id="component0"><template><e j="b" c="kh"></e><g i="gj"></g></template><preview name="main"><component0 e="l"></component0></preview></component>`
      ],
      [
        `<component id="component0">
            <template>
                <b></b>
                <slot name="a0"></slot>
            </template>
            <preview name="main">
                <component0></component0>
            </preview>
        </component>`,
        `<component id="component0">
            <template>
              <slot name="b0"></slot>
              <b></b>
            </template>
            <preview name="main">
              <component0></component0>
            </preview>
        </component>`
      ],
      [
        `<component id="component0">
            <template>
                <g></g>
                <l></l>
            </template>
            <preview name="main">
                <component0></component0>
            </preview>
        </component>`,
        `<component id="component0">
            <template>
                <slot name="h0"></slot>
                <k></k>
                <l></l>
            </template>
            <preview name="main">
                <component0></component0>
            </preview>
        </component>`
      ],
      [
        `<component id="component0">
            <template>
                <slot name="g0"></slot>
            </template>
            <preview name="main">
                <component0 b="le" g="g" g="ej" i="ah"></component0>
            </preview>
        </component>`,
        `<component id="component0">
            <template>
                <slot name="e0"></slot>
                <slot name="e0"></slot>
            </template>
            <preview name="main">
                <component0 g="g"></component0>
            </preview>
        </component>`
      ],
      [
        `<component id="component0">
            <template><i i="j"></i></template>
            <preview name="main">
                <component0></component0>
            </preview>
        </component>`,
        `<component id="component0">
            <template>
                <i g="j" i="i" k="c" k="a"></i>
            </template>
            <preview name="main">
                <component0 e="l" g="h" i="ik"></component0>
            </preview>
        </component>`
      ],
      [
        `<component id="component0">
            <template>
                <l></l>
                <slot name="d1">
                    <slot name="d1"></slot>
                </slot>
            </template>
            <preview name="main">
                <component0></component0>
            </preview>
        </component>`,
        `<component id="component0">
            <template>
                <slot name="l0"></slot>
                <l>lcf</l>
            </template>
            <preview name="main">
                <component0></component0>
            </preview>
        </component>`
      ],
      [
        `<component id="component0">
          <template>
            <slot name="a0">fch</slot>
          </template>
          <preview name="main">
            <component0></component0>
          </preview>
        </component>`,
        `<component id="component0">
          <template>
            <slot name="e0">
              <slot name="e0"></slot>dbcf
            </slot>
          </template>
          <preview name="main">
            <component0></component0>
          </preview>
        </component>`
      ],
      [
        `<component id="component0">
            <template></template>
            <preview name="main">
                <component0></component0>
            </preview>
        </component>`,
        `<component id="component0">
            <style>
                .container {
                  color: red;
                }
            </style>
            <template></template>
            <preview name="main">
                <component0></component0>
            </preview>
        </component>`
      ],
      [
        `
        <component id="component1">
            <style>
                @media k {
                   
                }
                
            </style>
            <template>
                <component0></component0>
            </template>
            <preview name="main">
                <component1></component1>
            </preview>
        </component>`,
        `<component id="component0">
            <style>
                @media g {
                    .k {
                        b: kh;
                        a: eb;
                        g: ki;
                    }
                }
            </style>
            <template>
                <c></c>
            </template>
            <preview name="main">
                <component0></component0>
            </preview>
        </component>
        <component id="component1">
            <style>
                @media e {
                    .l {
                        d: fk;
                    }
                }
            </style>
            <template>
                <component0></component0>
            </template>
            <preview name="main">
                <component1></component1>
            </preview>
        </component>`
      ],
      [
        `
          <component id="test1">
            <template>
              <div class="a"></div>
            </template>
            <preview name="main"> 
              <test1 />
            </preview>
          </component>
        `,
        `
          <component id="test1">
            <template>
              <div class="b"></div>
            </template>
            <preview name="main"> 
              <test1 />
            </preview>
          </component>
        `
      ],
      [
        `
          <component id="test1">
            <template>
              <span class="a"></div>
            </template>
            <preview name="main"> 
              <test1 />
            </preview>
          </component>
        `,
        `
          <component id="test1">
            <template>
              <div class="b"></div>
            </template>
            <preview name="main"> 
              <test1 />
            </preview>
          </component>
        `
      ]
    ].forEach((variants) => {
      it(`can diff & patch ${variants.join(" -> ")}`, async () => {
        await diffPatchVariants(variants);
      });
    });

    describe("components", () => {
      describe("fuzzy", () => {
        const tests = Array.from({ length: 100 }).map(() => {
          return Array.from({ length: 2 }).map(() => generateRandomComponents(4, 4, 4, 4, 4, 4, 4))
        });
        
        tests.forEach((variants) => {
          it(`can diff & patch ${variants.join(" -> ")}`, async () => {
            await diffPatchVariants(variants);
          });
        });
      });
    });

    describe("CSS", () => {
      [
        [`.a {}`, `.b {}`],
        [`.a {} .b {}`, `.b {} .a {}`],
        [`.a {} .b {}`, `.b {}`],
        [`.a {b: c; d: e;}`, `.b {d:e;b:c;}`],

        // busted fuzzy tests
        [`@keyframes a {}`, `@keyframes b {}`],
        [`@keyframes a { 0% { color: red; }}`, `@media b { .c { color: blue; }}`],
        [`.k { e: a;}`, `i { f: kb; e: k;} .i { a: e;}`],
        [`.i { h: ag;}`, `@media e { .f { h: ea;}}`, `.g { c: el;} @media k { .k { l: h; d: gk;}}`],
        [`.i { g: d; a: fk; g: ca;}`, `.f { g: d;}`],
        [`.d { a: h; i: le; h: j;}`, `.a { g: b; c: k; g: c;}  @keyframes j { 100% { a: kl;}  4% { g: c;}}`],
        [`.l { i: kj; g: dg;}`, `.b { k: c; g: d; i: e;}`]
      ].forEach((variants: any) => {
        it(`can diff & patch ${variants.join(" -> ")}`, async () => {
          await diffPatchVariants(variants.map(variant => {
            return `
            <component id="test">
              <style>
                ${variant}
              </style>
              <template>
                <slot></slot>
              </template>
              <preview name="main">
                <test />
              </preview>
            </component>
            `;
          }));
        });
      });
      describe(`fuzzy tests`, () => {

        const tests = Array.from({ length: 100 }).map(() => {
          return Array.from({ length: 4 }).map(() => generateRandomStyleSheet(5, 5))
        });

        tests.forEach((variants) => {
          it(`can diff & patch ${variants.join(" -> ")}`, async () => {
            await diffPatchVariants(variants.map(variant => {
              return `
              <component id="test">
                <style>
                  ${variant}
                </style>
                <template>
                  <slot></slot>
                </template>
                <preview name="main">
                  <test />
                </preview>
              </component>
              `;
            }));
          });
        });
      });
    });    
  });
});

const diffPatchVariants = async (variants: string[]) => {
  const fakeDocument = new FakeDocument();
  const body = fakeDocument.createElement("body");
  let map: any;
  let currentDocument: SlimParentNode;
  for (const variant of variants) {
    const newDocument = await runPCComponent({
      "entry.pc": variant
    });
    if (!currentDocument) {
      currentDocument = setVMObjectIds(newDocument, "item");
      map = renderDOM2(currentDocument, body as any);
    } else {
      const result = patchNodeAndDOM(currentDocument, newDocument, body as any, map);
      currentDocument = result.node;
      map = result.map;

      const expBody = fakeDocument.createElement("body");
      renderDOM2(newDocument, expBody as any);
      expect(body.toString()).to.eql(expBody.toString());
    }
  }
}

const patchNodeAndDOM = (oldNode: SlimParentNode, newNode: SlimParentNode, mount: HTMLElement, map: NativeObjectMap) => {
  const diffs = prepDiff(oldNode, diffNode(oldNode, newNode));
  for (const mutation of diffs) {
    map = patchDOM2(mutation, oldNode, mount, map);
    oldNode = patchNode2(mutation, oldNode);
  }

  return { node: oldNode, map };
};

const runPCTemplate = async (source) => await runPCComponent({
  "entry.pc": `<component id="comp"><template>${source}</template><preview name="main"><comp /></preview></component>`
});

const runPCComponent = async (files, entry = Object.keys(files)[0]) => {
  const { graph, diagnostics: graphDiagnostics } = await loadModuleDependencyGraph(entry, {
    readFile: (filePath) => files[filePath]
  });

  if (graphDiagnostics.length) {
    console.error(JSON.stringify(graphDiagnostics, null, 2));
    throw graphDiagnostics[0];
  }

  const { module } = graph[entry];
  
  const { document, diagnostics } = runPCFile({ 
    entry: {
      filePath: entry,
      componentId: (module as ComponentModule).components[0].id,
      previewName: (module as ComponentModule).components[0].previews[0].name
    },
    graph
  });

  return document as SlimParentNode;
};