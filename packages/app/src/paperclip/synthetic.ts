import { TreeNode, TreeNodeAttributes, getTeeNodePath, generateTreeChecksum } from "./tree";
import { arraySplice } from "../common/utils";
import { DependencyGraph, Dependency, getModuleInfo } from "./dsl";

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
  location: string;
  type: SyntheticObjectType;
  document?: SyntheticNode;
  mount: HTMLElement;
  computed?: ComputedDisplayInfo;
};

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

export const getSyntheticWindow = (uri: string, browser: SyntheticBrowser) => browser.windows.find(window => window.location === uri);

export const createSyntheticWindow = (location: string): SyntheticWindow => ({
  location,
  mount: document.createElement("div"),
  type: SyntheticObjectType.WINDOW,
});

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
