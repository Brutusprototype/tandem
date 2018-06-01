import {
  memoize,
  EMPTY_OBJECT,
  EMPTY_ARRAY,
  TreeNode,
  filterNestedNodes,
  createNodeNameMatcher,
  findNestedNode,
  Bounds,
  createTreeNode,
  generateUID,
  KeyValue,
  getNestedTreeNodeById,
  replaceNestedNode,
  removeNestedTreeNode
} from "tandem-common";
import { mapValues, merge } from "lodash";
import { Dependency, DependencyGraph, updateGraphDependency } from "./graph";

export const PAPERCLIP_MODULE_VERSION = "0.0.2";

export enum PCSourceTagNames {
  MODULE = "module",
  COMPONENT = "component",
  TEMPLATE = "template",
  ELEMENT = "element",
  COMPONENT_INSTANCE = "component-instance",
  VARIANT = "variant",
  OVERRIDE_STYLE = "override-style",
  OVERRIDE_ATTRIBUTES = "override-attributes",
  OVERRIDE_REMOVE_VARIANT = "override-remove-variant",
  OVERRIDE_ADD_VARIANT = "override-add-variant",
  OVERRIDE_TEXT_VALUE = "override-text-value",
  OVERRIDE_CHILDREN = "override-children",
  TEXT = "text",
  FRAME = "frame"
}

/*------------------------------------------
 * CONSTANTS
 *-----------------------------------------*/

export const DEFAULT_FRAME_BOUNDS: Bounds = {
  left: 0,
  top: 0,
  right: 400,
  bottom: 300
};

/*------------------------------------------
 * STATE
 *-----------------------------------------*/

type PCBaseSourceNode<TName extends PCSourceTagNames> = {
  children: PCBaseSourceNode<any>[];
} & TreeNode<TName>;

export type PCDependency = Dependency<PCModule>;

export type PCModule = {
  version: string;
  children: PCFrame[];
} & PCBaseSourceNode<PCSourceTagNames.MODULE>;

export type PCFrame = {
  // agent to use for DOM renderer
  navigator?: string;
  bounds: Bounds;
  children: Array<PCComponent | PCVisibleNode>;
} & PCBaseSourceNode<PCSourceTagNames.FRAME>;

export type PCComponent = {
  label?: string;
  container?: boolean;
  style: KeyValue<any>;
  attributes: KeyValue<string>;
  is?: string;
  children: Array<PCVisibleNode | PCVariant | PCOverride>;
} & PCBaseSourceNode<PCSourceTagNames.COMPONENT>;

export type PCVariant = {
  label: string;
  isDefault?: boolean;
} & PCBaseSourceNode<PCSourceTagNames.VARIANT>;

export type PCBaseOverride<TName extends PCSourceTagNames> = {
  targetIdPath: string[];
  variantId: string;
} & PCBaseSourceNode<TName>;

export type PCStyleOverride = {
  value: KeyValue<any>;
} & PCBaseOverride<PCSourceTagNames.OVERRIDE_STYLE>;

export type PCAttributesOverride = {
  value: KeyValue<any>;
} & PCBaseOverride<PCSourceTagNames.OVERRIDE_ATTRIBUTES>;

export type PCChildrenOverride = {
  children: PCVisibleNode[];
} & PCBaseOverride<PCSourceTagNames.OVERRIDE_CHILDREN>;

export type PCTextValueOverride = {
  value: string;
  children: PCVisibleNode[];
} & PCBaseOverride<PCSourceTagNames.OVERRIDE_TEXT_VALUE>;

export type PC = {
  value: string;
  children: PCVisibleNode[];
} & PCBaseOverride<PCSourceTagNames.OVERRIDE_TEXT_VALUE>;

export type PCOverride =
  | PCStyleOverride
  | PCAttributesOverride
  | PCChildrenOverride;

export type PCBaseVisibleNode<TName extends PCSourceTagNames> = {
  label?: string;
  style: KeyValue<any>;
} & PCBaseSourceNode<TName>;

export type PCBaseElement<TName extends PCSourceTagNames> = {
  container?: boolean;
  is: string;
  attributes: KeyValue<string>;
  children: (PCBaseVisibleNode<any> | PCOverride)[];
} & PCBaseVisibleNode<TName>;

export type PCElement = PCBaseElement<PCSourceTagNames.ELEMENT>;

export type PCComponentInstanceElement = {
  variant: string[];
} & PCBaseElement<PCSourceTagNames.COMPONENT_INSTANCE>;

export type PCTextNode = {
  value: string;
} & PCBaseVisibleNode<PCSourceTagNames.TEXT>;

export type PCVisibleNode = PCElement | PCTextNode | PCComponentInstanceElement;
export type PCNode =
  | PCModule
  | PCFrame
  | PCComponent
  | PCVariant
  | PCOverride
  | PCVisibleNode;

/*------------------------------------------
 * FACTORIES
 *-----------------------------------------*/

export const createPCModule = (children: PCFrame[] = []): PCModule => ({
  id: generateUID(),
  name: PCSourceTagNames.MODULE,
  version: PAPERCLIP_MODULE_VERSION,
  children
});
export const createPCFrame = (
  children: Array<PCComponent | PCVisibleNode> = [],
  bounds: Bounds = DEFAULT_FRAME_BOUNDS
): PCFrame => ({
  id: generateUID(),
  name: PCSourceTagNames.FRAME,
  bounds,
  children
});

export const createPCComponent = (
  label?: string,
  is?: string,
  style?: KeyValue<string>,
  attributes?: KeyValue<string>,
  children: Array<PCVariant | PCVisibleNode | PCOverride> = []
): PCComponent => ({
  label,
  is: is || "div",
  style: style || EMPTY_OBJECT,
  attributes: attributes || EMPTY_OBJECT,
  id: generateUID(),
  name: PCSourceTagNames.COMPONENT,
  children: children || EMPTY_ARRAY
});

export const createPCVariant = (
  label?: string,
  isDefault?: boolean
): PCVariant => ({
  id: generateUID(),
  name: PCSourceTagNames.VARIANT,
  label,
  isDefault,
  children: []
});

export const createPCChildrenOverride = (
  targetIdPath: string[],
  variantId?: string,
  children?: PCVisibleNode[]
): PCChildrenOverride => ({
  id: generateUID(),
  name: PCSourceTagNames.OVERRIDE_CHILDREN,
  targetIdPath,
  variantId,
  children
});

export const createPCStyleOverride = (
  targetIdPath: string[],
  variantId?: string,
  value?: KeyValue<any>
): PCStyleOverride => ({
  id: generateUID(),
  name: PCSourceTagNames.OVERRIDE_STYLE,
  targetIdPath,
  variantId,
  value: value || {},
  children: []
});

export const createPCAttributesOverride = (
  targetIdPath: string[],
  variantId?: string,
  value?: KeyValue<any>
): PCStyleOverride => ({
  id: generateUID(),
  name: PCSourceTagNames.OVERRIDE_STYLE,
  targetIdPath,
  variantId,
  value: value || {},
  children: []
});

export const createPCElement = (
  is: string = "div",
  style: KeyValue<any> = {},
  attributes: KeyValue<string> = {},
  children: (PCVisibleNode | PCOverride)[] = [],
  label?: string
): PCElement => ({
  id: generateUID(),
  label,
  is: is || "div",
  name: PCSourceTagNames.ELEMENT,
  attributes: attributes || {},
  style: style || {},
  children: children || []
});

export const createPCComponentInstance = (
  is: string,
  variant?: string[],
  style: KeyValue<any> = {},
  attributes: KeyValue<string> = {},
  children: PCVisibleNode[] = []
): PCComponentInstanceElement => ({
  id: generateUID(),
  variant: variant || [],
  is: is || "div",
  name: PCSourceTagNames.COMPONENT_INSTANCE,
  attributes: attributes || {},
  style: style || {},
  children
});

export const createPCTextNode = (
  value: string,
  label?: string
): PCTextNode => ({
  id: generateUID(),
  name: PCSourceTagNames.TEXT,
  label: label || value,
  value,
  style: {},
  children: []
});

export const createPCDependency = (
  uri: string,
  module: PCModule
): Dependency<PCModule> => ({
  uri,
  originalContent: module,
  content: module
});

/*------------------------------------------
 * TYPE UTILS
 *-----------------------------------------*/

export const isComponentFrame = (frame: PCFrame) =>
  frame.children[0].name === PCSourceTagNames.COMPONENT;

export const isVisibleNode = (node: PCNode) =>
  node.name === PCSourceTagNames.ELEMENT ||
  node.name === PCSourceTagNames.TEXT ||
  node.name === PCSourceTagNames.COMPONENT_INSTANCE;
export const isPCOverride = (node: PCNode) =>
  node.name === PCSourceTagNames.OVERRIDE_ATTRIBUTES ||
  node.name === PCSourceTagNames.OVERRIDE_CHILDREN ||
  node.name === PCSourceTagNames.OVERRIDE_STYLE;

export const extendsComponent = (
  element: PCElement | PCComponent | PCComponentInstanceElement
) => element.is.length > 6;

export const assertValidPCModule = memoize((module: PCModule) => {
  if (!validatePCModule(module)) {
    throw new Error(`Malformed PC Module`);
  }
});

// TODO - use schema here instead
export const validatePCModule = (module: PCModule) => {
  if (
    module.name !== PCSourceTagNames.MODULE ||
    module.version !== PAPERCLIP_MODULE_VERSION
  ) {
    return false;
  }
  return module.children.every(validatePCFrame);
};

const validatePCFrame = (frame: PCFrame) => {
  if (
    frame.name !== PCSourceTagNames.FRAME ||
    !frame.bounds ||
    frame.children.length > 1
  ) {
    return false;
  }
  return frame.children.every(validateFrameChild);
};

const validateFrameChild = (child: PCVisibleNode | PCComponent) => {
  if (child.name === PCSourceTagNames.COMPONENT) {
    return validateComponent(child);
  } else {
    return validatePCVisibleNode(child);
  }
};

const validateComponent = (component: PCComponent) => {
  // TODO
  return true;
};

const validatePCVisibleNode = (child: PCVisibleNode) => {
  if (child.name === PCSourceTagNames.ELEMENT) {
    return validatePCElement(child);
  }
  return true;
};

const validatePCVisibleNodeChild = (child: PCVisibleNode | PCOverride) => {
  // TODO - OVERRIDES
  if (child.name === PCSourceTagNames.OVERRIDE_STYLE) {
    return true;
  } else {
    return validatePCVisibleNode(child as PCVisibleNode);
  }
};

const validatePCElement = (element: PCElement) => {
  // TODO - validate that style props are all camel case
  if (!element.style || !element.attributes || !element.is) {
    return false;
  }
  return element.children.every(validatePCVisibleNodeChild);
};

/*------------------------------------------
 * GETTERS
 *-----------------------------------------*/

export const getModuleComponents = memoize((root: PCModule): PCComponent[] =>
  root.children.reduce((components, frame) => {
    return frame.children[0].name === PCSourceTagNames.COMPONENT
      ? [...components, frame.children[0]]
      : components;
  }, [])
);

export const getVisibleChildren = (node: PCVisibleNode | PCComponent) =>
  node.children.filter(isVisibleNode) as PCVisibleNode[];
export const getOverrides = (node: PCNode) =>
  node.children.filter(isPCOverride) as PCOverride[];

export const getPCImportedChildrenSourceUris = (
  { id: nodeId }: PCNode,
  graph: DependencyGraph
) => {
  const node = getPCNode(nodeId, graph);
  const imported = {};
  findNestedNode(node, (child: PCNode) => {
    const dep = getPCNodeDependency(child.id, graph);
    imported[dep.uri] = 1;
  });
  return Object.keys(imported);
};

export const getPCNodeDependency = memoize(
  (nodeId: string, graph: DependencyGraph) => {
    for (const uri in graph) {
      const dependency = graph[uri];
      if (getNestedTreeNodeById(nodeId, dependency.content)) {
        return dependency;
      }
    }
    return null;
  }
);

export const getPCNode = (nodeId: string, graph: DependencyGraph) => {
  const dep = getPCNodeDependency(nodeId, graph);
  return getNestedTreeNodeById(nodeId, dep.content) as PCNode;
};

export const getPCNodeModule = (nodeId: string, graph: DependencyGraph) => {
  return getPCNodeDependency(nodeId, graph).content;
};

export const getPCNodeFrame = (nodeId: string, module: PCModule) => {
  return module.children.find(frame => getNestedTreeNodeById(nodeId, frame));
};

export const getModuleComponent = memoize(
  (componentId: string, module: PCModule): PCComponent => {
    const frame = getPCNodeFrame(componentId, module);
    return frame && (frame.children[0] as PCComponent);
  }
);

export const getComponentTemplate = (component: PCComponent) =>
  component.children.find(isVisibleNode) as PCVisibleNode;

export const getComponentVariants = (component: PCComponent) =>
  component.children.filter(
    child => child.name === PCSourceTagNames.VARIANT
  ) as PCVariant[];

export const getDefaultVariantIds = (component: PCComponent) =>
  getComponentVariants(component)
    .filter(variant => variant.isDefault)
    .map(variant => variant.id);

export const getNodeSourceComponent = memoize(
  (node: PCComponentInstanceElement, graph: DependencyGraph) =>
    getModuleComponent(node.name, getPCNodeModule(node.id, graph))
);

/*------------------------------------------
 * SETTERS
 *-----------------------------------------*/

export const replacePCNode = (
  newNode: PCNode,
  oldNode: PCNode,
  graph: DependencyGraph
) => {
  const dependency = getPCNodeDependency(oldNode.id, graph);
  return updateGraphDependency(
    {
      content: replaceNestedNode(newNode, oldNode.id, dependency.content)
    },
    dependency.uri,
    graph
  );
};
