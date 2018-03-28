import { TreeNode, TreeNodeAttributes, getTeeNodePath, generateTreeChecksum, getTreeNodeFromPath } from "../common/state/tree";
import { arraySplice, generateId } from "../common/utils";
import { DependencyGraph, Dependency, getModuleInfo } from "./dsl";
import { renderDOM } from "./dom-renderer";

export enum SyntheticObjectType {
  BROWSER,
  WINDOW,
  DOCUMENT,
  ELEMENT,
  TEXT_NODE
};

export type SyntheticObject = {
};

export type ComputedDisplayInfo = {
  [identifier: string]: {
    rect: ClientRect;
    style: CSSStyleDeclaration;
  }
};

export type SyntheticBrowser = {
  type: SyntheticObjectType;
  windows: SyntheticWindow[];
  graph?: DependencyGraph;
};

export type SyntheticWindow = {
  id: string;
  location: string;
  type: SyntheticObjectType;
  documents?: SyntheticDocument[];
};

export type SyntheticDocument = {
  id: string;
  type: SyntheticObjectType;
  root: SyntheticNode;
  container: HTMLIFrameElement;
  computed?: ComputedDisplayInfo;
}


export type SyntheticNodeSource = {
  uri: string;
  checksum: string;
  path: number[];
};

export type SyntheticNode = {
  source: SyntheticNodeSource
} & TreeNode;

export const updateSyntheticBrowser = (properties: Partial<SyntheticBrowser>, browser: SyntheticBrowser) => ({
  ...browser,
  ...properties
});

export const updateSyntheticWindow = (location: string, properties: Partial<SyntheticWindow>, browser: SyntheticBrowser) => {
  const window = getSyntheticWindow(location, browser);
  if (!window) {
    throw new Error(`window does not exist with location: ${location}`);
  }

  const index = browser.windows.indexOf(window);
  return updateSyntheticBrowser({
    windows: arraySplice(browser.windows, index, 1, {
      ...window,
      ...properties
    })
  }, browser);
}

export const getSyntheticWindow = (location: string, browser: SyntheticBrowser) => browser.windows.find(window => window.location === location);

export const createSyntheticWindow = (location: string): SyntheticWindow => ({
  location,
  id: generateId(),
  type: SyntheticObjectType.WINDOW,
});

export const createSyntheticDocument = (root: SyntheticNode): SyntheticDocument => {

  const container = document.createElement("iframe");
  container.style.border = "none";
  container.style.width = "100%";
  container.style.height = "100%";

  const syntheticDocument: SyntheticDocument = {
    root,
    container,
    id: generateId(),
    type: SyntheticObjectType.DOCUMENT,
  };

  return syntheticDocument;
};

export const addSyntheticWindow = (window: SyntheticWindow, browser: SyntheticBrowser) => updateSyntheticBrowser({
  windows: arraySplice(browser.windows, 0, 0, window),
}, browser);

export const createSyntheticElement = (name: string, attributes: TreeNodeAttributes, children: TreeNode[], source: SyntheticNodeSource, id: string): SyntheticNode => ({
  id,
  name,
  attributes,
  children,
  source
});

export const getSytheticNodeSource = (source: TreeNode, dependency: Dependency): SyntheticNodeSource => ({
  uri: dependency.uri,
  checksum: generateTreeChecksum(dependency.content),
  path: getTeeNodePath(source, getModuleInfo(dependency.content).source),
});

export const getSyntheticNodeSourceNode = (synthetic: SyntheticNode, sourceRoot: TreeNode) => getTreeNodeFromPath(synthetic.source.path, sourceRoot);
