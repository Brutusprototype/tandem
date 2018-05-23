import { TreeNodeAttributes, getTreeNodePath, generateTreeChecksum, getTreeNodeFromPath, getAttribute, getNestedTreeNodeById, getTreeNodeIdMap, DEFAULT_NAMESPACE, updateNestedNode, setNodeAttribute, findNodeByTagName, TreeNode, TreeNodeUpdater, findNestedNode, addTreeNodeIds, removeNestedTreeNode, updateNestedNodeTrail, appendChildNode, replaceNestedNode, getParentTreeNode, cloneNode, getTreeNodeUidGenerator, filterNestedNodes, findTreeNodeParent, insertChildNode, TreeMoveOffset } from "tandem-common/src/state/tree";
import { arraySplice, generateId, memoize, EMPTY_ARRAY, EMPTY_OBJECT, ArrayOperationalTransform, castStyle, createUIDGenerator } from "tandem-common/src/utils";
import { DependencyGraph, Dependency, getModuleInfo, getComponentInfo, getNodeSourceDependency, updateGraphDependency, getDependents, SetAttributeOverride, getNodeSourceModule, getNodeSourceComponent, addModuleNodeImport, getModuleImportNamespace, PCSourceAttributeNames, ComponentVariantInfo, PCSourceTagNames, isComponentInstanceSourceNode } from "./dsl";
import { renderDOM, patchDOM, computeDisplayInfo } from "./dom-renderer";
import { Bounds, Struct, shiftBounds, StructReference, Point, getBoundsSize, pointIntersectsBounds, moveBounds, boundsFromRect, parseStyle, resizeBounds, mergeBounds } from "tandem-common";
import { mapValues, pull } from "lodash";
import { createSetAttributeTransform, OperationalTransform, diffNode, patchNode, OperationalTransformType, SetAttributeTransform } from "tandem-common/src/utils/tree";
import { evaluateDependencyEntry } from "./evaluate";
import * as path from "path";
import { convertFixedBoundsToRelative, convertFixedBoundsToNewAbsoluteRelativeToParent, isRelativeNode, getRelativeParent } from "./synthetic-layout";

export const EDITOR_NAMESPACE = "editor";

export enum EditorAttributeNames {
  IS_COMPONENT_INSTANCE = "isComponentInstance",
  IS_COMPONENT_ROOT = "isComponentRoot",
  CREATED_FROM_COMPONENT = "createFromComponent"
};

export type TreeNodeClip = {
  uri: string;
  node: TreeNode;
  namespaceUris: {
    [identifier: string]: string
  }
};


const DEFAULT_BOUNDS = {
  left: 0,
  top: 0,
  right: 400,
  bottom: 300
};

const PASTED_ARTBOARD_OFFSET = {
  left: 20,
  top: 20
};

export enum SyntheticObjectType {
  BROWSER,
  WINDOW,
  DOCUMENT,
  ELEMENT
};

export type SyntheticObject = {
};

export type ComputedDisplayInfo = {
  [identifier: string]: {
    bounds: Bounds;
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

  // transforms from current state
  transforms?: OperationalTransform[];
  type: SyntheticObjectType;
  root: SyntheticNode;
  container: HTMLIFrameElement;
  nativeNodeMap?: any;
  computed?: ComputedDisplayInfo;
  bounds?: Bounds;
}

export type SyntheticNodeSource = {
  uri: string;
  path: number[];
};

export type SyntheticNode = {
  source: SyntheticNodeSource;
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

export const isSyntheticDocumentRoot = (node: SyntheticNode) => {
  return node.source.path.length === 1;
};

export const getSyntheticWindow = (location: string, browser: SyntheticBrowser) => browser.windows.find(window => window.location === location);

export const createSyntheticWindow = (location: string): SyntheticWindow => ({
  location,
  id: generateId(),
  type: SyntheticObjectType.WINDOW,
});

const calculateRootNodeBounds = (rootSourceNode: TreeNode): Bounds =>  {
  const style = getAttribute(rootSourceNode, "style") || EMPTY_OBJECT;
  const left = style.left || DEFAULT_BOUNDS.left;
  const top = style.top || DEFAULT_BOUNDS.top;
  const right = style.right || (style.width ? left + style.width : DEFAULT_BOUNDS.right);
  const bottom = style.bottom || (style.height ? top + style.height : DEFAULT_BOUNDS.bottom);
  return { left, right, top, bottom };
};

const getSyntheticDocumentBounds = (documentRootNode: SyntheticNode, moduleRootNode: TreeNode) => {
  const rootSourceNode = getTreeNodeFromPath(documentRootNode.source.path, moduleRootNode);
  const bounds = getAttribute(rootSourceNode, "bounds", EDITOR_NAMESPACE) || calculateRootNodeBounds(rootSourceNode);
  return typeof bounds === "string" ? mapValues(parseStyle(bounds), Number) as Bounds : bounds;
};

export const createSyntheticDocument = (documentRootNode: SyntheticNode, moduleRootNode: TreeNode): SyntheticDocument => {

  const container = document.createElement("iframe");
  container.style.border = "none";
  container.style.width = "100%";
  container.style.height = "100%";
  container.style.background = "transparent";
  container.addEventListener('load', () => {
    Object.assign(container.contentDocument.body.style, {
      padding: 0,
      margin: 0
    });
  });

  const syntheticDocument: SyntheticDocument = {
    root: documentRootNode,
    container,
    bounds: getSyntheticDocumentBounds(documentRootNode, moduleRootNode),
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
  source,
});

export const getSyntheticOriginSourceNodeUri = (node: SyntheticNode, browser: SyntheticBrowser) => {
  const sourceNode = getSyntheticSourceNode(node.id, browser);
  const dep = browser.graph[node.source.uri];
  const module = getModuleInfo(dep.content);
  return dep.importUris[module.imports[sourceNode.namespace]] || dep.uri;
};

export const getSyntheticOriginSourceNode = (node: SyntheticNode, browser: SyntheticBrowser) => {
  const sourceNode = getSyntheticSourceNode(node.id, browser);
  const originUri = getSyntheticOriginSourceNodeUri(node, browser);
  const originDep = browser.graph[originUri];
  return isComponentInstanceSourceNode(sourceNode) ? originDep.content.children.find(child => getComponentInfo(child).id === sourceNode.name) : getSyntheticSourceNode(node.id, browser);
};

export const findSourceSyntheticNode = (node: TreeNode, targetUri: string, browser: SyntheticBrowser): SyntheticNode => {
  const dep = getSourceNodeDependency(node.id, browser);
  const nodePath = getTreeNodePath(node.id, dep.content).join("");

  const targetDep = browser.graph[targetUri];
  const window = browser.windows.find(window => window.location === targetUri);
  if (!window.documents) {
    return;
  }

  for (const document of window.documents) {
    const synthetic = findNestedNode(document.root, (synthetic: SyntheticNode) => {
      return synthetic.source.path.join("") === nodePath;
    });
    if (synthetic) {
      return synthetic;
    }
  }
};

export const getSytheticNodeSource = (source: TreeNode, dependency: Dependency): SyntheticNodeSource => ({
  uri: dependency.uri,
  path: getTreeNodePath(source.id, getModuleInfo(dependency.content).source),
});

export const getSyntheticSourceNode = (syntheticNodeId: string, browser: SyntheticBrowser) => {
  const synthetic = getSyntheticNodeById(syntheticNodeId, browser);
  return getTreeNodeFromPath(synthetic.source.path, browser.graph[synthetic.source.uri].content);
};

export const getNamespaceUris = memoize((sourceNodeId: string, browser: SyntheticBrowser) => {
  const sourceNode = getSourceNodeById(sourceNodeId, browser);
  const dependency = getSourceNodeDependency(sourceNodeId, browser);
  const moduleInfo = getModuleInfo(dependency.content);
  const namespaceUris = {};
  findNestedNode(sourceNode, (node: TreeNode) => {
    const uri = moduleInfo.imports[node.namespace];
    if (uri) {
      namespaceUris[node.namespace] = "file:/" + path.resolve(path.dirname(dependency.uri).substr("file:/".length), uri);
    }
    return false;
  });

  return namespaceUris;
});

export const getSyntheticWindowDependency = (window: SyntheticWindow, graph: DependencyGraph) => graph && graph[window.location];
export const getSyntheticDocumentDependency = (documentId: string, browser: SyntheticBrowser) => getSyntheticWindowDependency(getSyntheticDocumentWindow(documentId, browser), browser.graph);
export const getSyntheticDocumentSourceNode = (document: SyntheticDocument, browser: SyntheticBrowser) => getSyntheticSourceNode(document.root.id, browser);

export const findSyntheticDocument = (state: SyntheticWindow|SyntheticBrowser, test: (document: SyntheticDocument) => Boolean) => {
  if (state.type === SyntheticObjectType.BROWSER) {
    for (const window of (state as SyntheticBrowser).windows) {
      const document = findSyntheticDocument(window, test);
      if (document) {
        return document;
      }
    }
    return null
  } else {
    const window = state as SyntheticWindow;
    if (window.documents) {
      for (const document of window.documents) {
        if (test(document)) {
          return document;
        }
      }
      return null;
    }
  }
};

export const getComputedNodeBounds = memoize((nodeId: string, document: SyntheticDocument) => {
  const info = document.computed;
  return info && info[nodeId] && info[nodeId].bounds || { left: 0, top: 0, right: 0, bottom: 0 };
});

export const getSyntheticNodeBounds = memoize((nodeId: string, browser: SyntheticBrowser) => {
  if (isSyntheticDocumentRoot(getSyntheticNodeById(nodeId, browser))) {
    return getSyntheticNodeDocument(nodeId, browser).bounds;
  } else {
    const document = getSyntheticNodeDocument(nodeId, browser);
    return shiftBounds(getComputedNodeBounds(nodeId, document), document.bounds);
  }
});

export const getSyntheticDocumentWindow = memoize((documentId: string, browser: SyntheticBrowser) => browser.windows.find(window => Boolean((window.documents || EMPTY_ARRAY).find(document => document.id === documentId))));

const updateSyntheticDocument = (properties: Partial<SyntheticDocument>, documentId: string, browser: SyntheticBrowser) => {
  const window = getSyntheticDocumentWindow(documentId, browser);
  const document = getSyntheticDocumentById(documentId, window);
  return updateSyntheticWindow(window.location, {
    documents: arraySplice(window.documents, window.documents.indexOf(document), 1, {
      ...document,
      ...properties
    })
  }, browser);
}

const applyDocumentElementTransforms = (transforms: OperationalTransform[], documentId: string, browser: SyntheticBrowser) => {
  const document: SyntheticDocument = getSyntheticDocumentById(documentId, browser);
  const nativeNodeMap = patchDOM(transforms, document.root, document.container.contentDocument.body.children[0] as HTMLElement, document.nativeNodeMap);
  return updateSyntheticDocument({
    computed: computeDisplayInfo(nativeNodeMap),
    nativeNodeMap
  }, document.id, browser);
};


const updateSyntheticItem = <TItem>(properties: Partial<TItem>, nodeId: string, browser: SyntheticBrowser) => {
  const document = getSyntheticNodeDocument(nodeId, browser);
  const item = getNestedTreeNodeById(nodeId, document.root) as SyntheticNode;
  const itemPath = getTreeNodePath(item.id, document.root);

  const transforms: OperationalTransform[] = [];

  const props: Partial<TreeNode> = properties;

  if (props.attributes) {
    for (const namespace in props.attributes) {
      for (const name in props.attributes[namespace]) {
        const value = props.attributes[namespace][name];
        if (getAttribute(item, name, namespace) === value) continue;
        transforms.push(createSetAttributeTransform(itemPath, name, namespace, value));
      }
    }
  }

  browser = applyDocumentElementTransforms(transforms, document.id, browser);

  // TODO - patch synthetic document with OTs

  return browser;
};

export const updateSyntheticNodeAttributes = (name: string, namespace: string, value: any, nodeId, browser: SyntheticBrowser) => {
  const node = getSyntheticNodeById(nodeId, browser);

  return updateSyntheticItem({
    attributes: {
      [namespace]: {
        ...(node.attributes[namespace] || EMPTY_OBJECT),
        [name]: value
      }
    }
  }, nodeId, browser);
};

export const updateSyntheticNodeStyle = (style: any, nodeId: string, browser: SyntheticBrowser) => {
  const node = getSyntheticNodeById(nodeId, browser);
  const oldStyle = getAttribute(node, "style") || EMPTY_OBJECT;

  return updateSyntheticNodeAttributes("style", DEFAULT_NAMESPACE, {
    ...oldStyle,
    ...style,
  }, nodeId, browser);
};

export const getSyntheticNodeById = (nodeId: string, browser: SyntheticBrowser) => {
  const document = getSyntheticNodeDocument(nodeId, browser);
  return document && getNestedTreeNodeById(nodeId, document.root) as SyntheticNode;
};

export const getSourceNodeById = (nodeId: string, browser: SyntheticBrowser) => {
  const dependency = getSourceNodeDependency(nodeId, browser);
  return dependency && getNestedTreeNodeById(nodeId, dependency.content);
};

export const getSourceNodeElementRoot = (nodeId: string, browser: SyntheticBrowser) => {
  const dependency = getSourceNodeDependency(nodeId, browser);
  return getTreeNodeFromPath(getTreeNodePath(nodeId, dependency.content).slice(0, 1), dependency.content);
};

export const getSourceNodeDependency = memoize((nodeId: string, browser: SyntheticBrowser): Dependency => {
  for (const uri in browser.graph) {
    const dep = browser.graph[uri];
    if (getNestedTreeNodeById(nodeId, dep.content)) {
      return dep;
    }
  }
  return null;
});

export const getSyntheticNodeOriginComponent = memoize((nodeId: string, browser: SyntheticBrowser) => {
  const node = getSyntheticNodeById(nodeId, browser);
  const componentInstanceNode = getComponentInstanceSyntheticNode(node.id, getSyntheticNodeDocument(node.id, browser).root) as SyntheticNode;
  if (!componentInstanceNode) {
    return getSyntheticNodeSourceComponent(node.id, browser);
  }

  return getComponentInfo(getSyntheticOriginSourceNode(componentInstanceNode, browser));
});

export const getComponentInstanceComponent = memoize((nodeId: string, browser: SyntheticBrowser) => {
  const node = getSyntheticNodeById(nodeId, browser);
  return getComponentInfo(getSyntheticOriginSourceNode(node, browser));
});

export const getSyntheticNodeSourceComponent = memoize((nodeId: string, browser: SyntheticBrowser) => {
  const document = getSyntheticNodeDocument(nodeId, browser);
  const componentNode = getSyntheticSourceNode(document.root.id, browser);
  if (!componentNode) {
    return null;
  }
  return getComponentInfo(componentNode);
});

export const updateSyntheticItemPosition = (position: Point, nodeId: string, browser: SyntheticBrowser) => {
  const bounds = getSyntheticNodeBounds(nodeId, browser);
  const newBounds = convertFixedBoundsToRelative(moveBounds(bounds, position), getSyntheticNodeById(nodeId, browser), getSyntheticNodeDocument(nodeId, browser));
  return updateSyntheticItemBounds(newBounds, nodeId, browser, PersistBoundsFilter.POSITION);
};

export const getNodeStyle = (node: TreeNode, name: string) => (getAttribute(node, "style") || EMPTY_OBJECT)[name];

export const isNodeMovable = (node: SyntheticNode) => node.source.path.length === 1 || /fixed|relative|absolute/.test(getNodeStyle(node, "position") || "static");
export const isNodeResizable = (node: SyntheticNode) => node.source.path.length === 1 || isNodeMovable(node) || /block|inline-block|flex|inline-flex/.test(getNodeStyle(node, "display") || "inline");

enum PersistBoundsFilter {
  WIDTH = 1,
  HEIGHT = 1 << 1,
  POSITION = 1 << 2
};

export const updateSyntheticItemBounds = (bounds: Bounds, nodeId: string, browser: SyntheticBrowser, filter: PersistBoundsFilter = PersistBoundsFilter.HEIGHT | PersistBoundsFilter.POSITION | PersistBoundsFilter.WIDTH) => {
  if (isSyntheticDocumentRoot(getSyntheticNodeById(nodeId, browser))) {
    return updateSyntheticDocument({
      bounds,
    }, getSyntheticNodeDocument(nodeId, browser).id, browser);
  } else {
    const node = getSyntheticNodeById(nodeId, browser);
    const document = getSyntheticNodeDocument(nodeId, browser);
    const style = getAttribute(node, "style") || EMPTY_OBJECT;

    let newStyle: any = {
      position: style.position || "relative",
    };

    if (filter & PersistBoundsFilter.POSITION) {
      const pos =  {
        left: bounds.left - document.bounds.left,
        top: bounds.top - document.bounds.top,
      };

      newStyle = {
        ...newStyle,
        ...pos
      };
    }

    if (filter & PersistBoundsFilter.WIDTH) {
      newStyle = {
        ...newStyle,
        width: bounds.right - bounds.left
      };
    }

    if (filter & PersistBoundsFilter.HEIGHT) {
      newStyle = {
        ...newStyle,
        height: bounds.bottom - bounds.top
      };
    }

    return updateSyntheticNodeStyle(newStyle, nodeId, browser);
  }
};

export const persistPasteSyntheticNodes = (dependencyUri: string, sourceNodeId: string, clips: TreeNodeClip[], browser: SyntheticBrowser) => {
  const targetDep = browser.graph[dependencyUri];
  let targetSourceNode = getParentTreeNode(sourceNodeId, targetDep.content) || getNestedTreeNodeById(sourceNodeId, targetDep.content);

  const targetNodeIsModuleRoot = targetSourceNode === targetDep.content;
  const moduleInfo = getModuleInfo(targetDep.content);

  let content = targetDep.content;
  let graph = browser.graph;
  let importUris = targetDep.importUris;

  for (const { uri, node, namespaceUris } of clips) {
    const sourceDep = browser.graph[uri];
    const generateUid = getTreeNodeUidGenerator(sourceDep.content);
    const sourceNode = node;

    // If there is NO source node, then possibly create a detached node and add to target component
    if (!sourceNode) {
      throw new Error("not implemented");
    }

    const isComponent = sourceNode.name === PCSourceTagNames.COMPONENT;

    // is component
    if (sourceNode.name === PCSourceTagNames.COMPONENT) {
      const bounds = calculateRootNodeBounds(sourceNode);

      let namespace: string;

      // TODO - need to possibly import import component
      if (uri !== targetDep.uri) {
        const relativePath = path.relative(path.dirname(targetDep.uri), sourceDep.uri);
        namespace = moduleInfo.imports[relativePath];
        content = addModuleNodeImport(relativePath, content);
        namespace = getModuleImportNamespace(relativePath, content);
        importUris = {
          ...importUris,
          [relativePath]: sourceDep.uri
        };
      }

      const info = getComponentInfo(sourceNode);

      const pos: Bounds = targetNodeIsModuleRoot ? shiftBounds(bounds, PASTED_ARTBOARD_OFFSET) : {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
      };


      const child: TreeNode = {
        name: info.id,
        namespace,
        id: generateUid(),
        attributes: {
          [DEFAULT_NAMESPACE]: {
            style: resizeBounds(pos, getBoundsSize(bounds))
          }
        },
        children: []
      };

      content = updateNestedNode(targetSourceNode, content, (target) => appendChildNode(child, target));
    } else {
      // TODO - need to recursively transform child namespaces

      const updateNamespaces = (node: TreeNode) => {
        node = {
          ...node,
          children: node.children.map(updateNamespaces)
        } as TreeNode;

        let sourceUri = namespaceUris[node.namespace];

        if (!sourceUri && isComponentInstanceSourceNode(node)) {
          sourceUri = sourceDep.uri;
        }

        if (sourceUri) {
          const sourceRelativeUri = path.relative(path.dirname(targetDep.uri), sourceUri);

          node = {...node, namespace: getModuleImportNamespace(sourceRelativeUri, content)};
          importUris = {
            ...importUris,
            [sourceUri]: sourceRelativeUri
          };
        }

        return node;
      }

      const clonedChild = updateNamespaces(cloneNode(sourceNode, generateUid));
      content = updateNestedNode(targetSourceNode, content, (target) => {
        target = appendChildNode(clonedChild, target);
        return target;
      });
    }

  };

  browser = {
    ...browser,
    graph: updateGraphDependency({
      importUris
    }, targetDep.uri, browser.graph)
  }

  browser = updateDependencyAndRevaluate({
    content,
  }, targetDep.uri, browser);

  return browser;
}

export const getSyntheticDocumentById = memoize((documentId: string, state: SyntheticWindow|SyntheticBrowser) => findSyntheticDocument(state, document => document.id === documentId));

export const getSyntheticNodeDocument = memoize((nodeId: string, state: SyntheticBrowser|SyntheticWindow): SyntheticDocument => findSyntheticDocument(state, document => {
  return Boolean(getNestedTreeNodeById(nodeId, document.root));
}));

export const setSyntheticNodeExpanded = (node: SyntheticNode, value: boolean, root: SyntheticNode): SyntheticNode => {
  const path = getTreeNodePath(node.id, root);
  const updater = (node) => {
    return setNodeAttribute(node, "expanded", value, EDITOR_NAMESPACE);
  };
  return (value ? updateNestedNodeTrail(path, root, updater) : updateNestedNode(node, root, updater)) as SyntheticNode;
};

export const expandSyntheticNode = (node: SyntheticNode, root: SyntheticNode) => setSyntheticNodeExpanded(node, true, root);
export const collapseSyntheticNode = (node: SyntheticNode, root: SyntheticNode) => setSyntheticNodeExpanded(node, false, root);

export const getSyntheticNodeWindow = memoize((nodeId: string, state: SyntheticBrowser) => getSyntheticDocumentWindow(getSyntheticNodeDocument(nodeId, state).id, state));

const persistSourceNodeChanges = (sourceNodeId: string, variantName: string, browser: SyntheticBrowser, updater: TreeNodeUpdater) => {

  const sourceNode = getSourceNodeById(sourceNodeId, browser);
  const elementSourceRoot = getSourceNodeElementRoot(sourceNode.id, browser);
  const sourceDependency = getSourceNodeDependency(sourceNodeId, browser);

  let updatedModuleSourceNode = updateNestedNode(sourceNode, sourceDependency.content, updater);

  if (variantName && elementSourceRoot.name === PCSourceTagNames.COMPONENT) {
    let stateSourceNode = elementSourceRoot.children.find(child => child.name === PCSourceTagNames.COMPONENT_VARIANT && getAttribute(child, "name") === variantName);

    const ots = diffNode(sourceDependency.content, updatedModuleSourceNode);
    updatedModuleSourceNode = sourceDependency.content;

    const overrideChildren: TreeNode[] = [];
    const targetName = getAttribute(sourceNode, "ref");
    for (const ot of ots) {
      switch(ot.type) {
        case OperationalTransformType.SET_ATTRIBUTE: {
          const { name, value, namespace } = ot as SetAttributeTransform;
          if (name === "style" && namespace === DEFAULT_NAMESPACE) {
            stateSourceNode = addSetStyleOverride(value, targetName, stateSourceNode);
          }
          break;
        }
        case OperationalTransformType.REMOVE_CHILD: {

          // set display none override since the parent template should be immutable
          stateSourceNode = addSetStyleOverride({ display: "none" }, targetName, stateSourceNode);
          break;
        }
        default: {
          throw new Error(`cannot override with ${OperationalTransformType.REMOVE_CHILD} operational transform.`);
        }
      }
    }

    if (ots.length) {
      updatedModuleSourceNode = replaceNestedNode(stateSourceNode, stateSourceNode.id, updatedModuleSourceNode);
    }
  }

  return updateDependencyAndRevaluate({
    content: updatedModuleSourceNode
  }, sourceDependency.uri, browser);
};

const addSetStyleOverride = (style: any, targetName: string, overridesNode: TreeNode) => {
  for (const key in style) {
    const existingStyleOverride = findNestedNode(overridesNode, (node) => node.name === "set-style" && getAttribute(node, "name") === key && getAttribute(node, "target") === targetName);
    if (existingStyleOverride) {
      overridesNode = updateNestedNode(existingStyleOverride, overridesNode, (child) => {
        return {
          ...child,
          attributes: {
            ...child.attributes,
            [DEFAULT_NAMESPACE]: {
              ...(child.attributes[DEFAULT_NAMESPACE] || EMPTY_OBJECT),
              value: style[key]
            }
          }
        }
      });
    } else {
      overridesNode = appendChildNode({
        name: "set-style",
        id: overridesNode.id + "set-style" + key,
        attributes: {
          [DEFAULT_NAMESPACE]: {
            name: key,
            value: style[key],
            target: targetName,
          }
        },
        children: []
      }, overridesNode);
    }
  }
  return overridesNode;
}

export const replaceDependency = (dep: Dependency, browser: SyntheticBrowser) => updateDependencyAndRevaluate(dep, dep.uri, browser);

const updateDependencyAndRevaluate = (properties: Partial<Dependency>, dependencyUri: string, browser: SyntheticBrowser) => {

  const oldBrowser = browser;
  const graph = updateGraphDependency(properties, dependencyUri, browser.graph);

  browser = updateSyntheticBrowser({
    graph: graph
  }, browser);

  // TODO - evaluate sourceDep dependents & update assoc windows

  const sourceDependents = getDependents(dependencyUri, graph);
  const sourceDependentUris = [dependencyUri];

  for (const dep of sourceDependents) {
    sourceDependentUris.push(dep.uri);
  }

  let depWindows: SyntheticWindow[] = [];
  for (const window of browser.windows) {
    if (sourceDependentUris.indexOf(window.location) === -1) {
      continue;
    }

    const { documentNodes } = evaluateDependencyEntry({
      entry: graph[window.location],
      graph
    });

    browser = updateSyntheticWindow(window.location, {
      documents: documentNodes.map(newDocumentNode => {
        const sourceComponent = getComponentInfo(getTreeNodeFromPath(newDocumentNode.source.path, browser.graph[newDocumentNode.source.uri].content));
        const document = window.documents.find(document => {
          const documentSourceNode = getSyntheticDocumentSourceNode(document, oldBrowser);
          return documentSourceNode.id === sourceComponent.source.id;
        });
        if (!document) {
          const newDocument = createSyntheticDocument(newDocumentNode, graph[window.location].content);
          return newDocument;
        }
        const ots = filterEditorOts(diffNode(document.root, newDocumentNode));
        const newRoot = copyTreeSources(patchNode(ots, document.root), newDocumentNode);
        const nativeNodeMap = document.container.contentDocument ? patchDOM(ots, document.root, document.container.contentDocument.body.children[0] as HTMLElement, document.nativeNodeMap) : document.nativeNodeMap;
        return {
          ...document,
          bounds: getSyntheticDocumentBounds(newRoot, graph[window.location].content),
          nativeNodeMap,
          computed: computeDisplayInfo(nativeNodeMap),
          root: newRoot
        }
      })
    }, browser);
  }

  return browser;
};

const filterEditorOts = (ots: OperationalTransform[]) => ots.filter(ot => {
  switch(ot.type) {
    case OperationalTransformType.SET_ATTRIBUTE: {
      return (ot as SetAttributeTransform).namespace !== EDITOR_NAMESPACE || !/expanded/.test((ot as SetAttributeTransform).name);
    }
  }
  return true;
});

const copyTreeSources = (a: SyntheticNode, b: SyntheticNode) => {
  let na = a;

  if (!syntheticSourceEquals(a.source, b.source)) {
    na = { ...na, source: b.source };
  }

  let newChildren;

  for (let i = a.children.length; i--;) {
    const c = a.children[i]
    const nc = copyTreeSources(c as SyntheticNode, b.children[i] as SyntheticNode);

    if (c !== nc) {
      if (!newChildren) {
        newChildren = a.children.slice(i + 1);
      }
    }

    if (newChildren) {
      newChildren.unshift(nc)
    }
  }

  if (newChildren) {
    return { ...na, children: newChildren };
  }

  return na;
};

const syntheticSourceEquals = (a: SyntheticNodeSource, b: SyntheticNodeSource) => {
  return a.uri === b.uri && a.path.join("") === b.path.join("");
};

const generateComponentId = (moduleNode: TreeNode) => {

  let i = moduleNode.children.length;
  let cid;

  while(1) {
    cid = "component" + (++i);
    const component = moduleNode.children.find(child => getAttribute(child, "id") === cid);
    if (!component) break;
  }
  return cid;
}

const createComponentNode = (dep: Dependency, bounds?: Bounds, parentId?: string) => {
  return addTreeNodeIds({
    name: "component",
    attributes: {
      [DEFAULT_NAMESPACE]: {
        id: generateComponentId(dep.content),
        extends: parentId
      },
      [EDITOR_NAMESPACE]: {
        bounds
      }
    },
    children: [
      {
        name: "template",
        attributes: {},
        children: []
      }
    ]
  }, dep.content.id);
};

export const persistNewComponent = (bounds: Bounds, dependencyUri: string, browser: SyntheticBrowser) => {
  const dep = browser.graph[dependencyUri];

  const newComponentNode: TreeNode = createComponentNode(dep, bounds);

  return updateDependencyAndRevaluate({
    content: {
      ...dep.content,
      children: [
        ...dep.content.children,
        newComponentNode
      ]
    }
  }, dependencyUri, browser);
};

export const persistInsertRectangle = (style: any, targetSourceNodeId: string, browser: SyntheticBrowser) => {
  return persistInsertNode({
    name: "rectangle",
    attributes: {
      [DEFAULT_NAMESPACE]: {
        style,
        [PCSourceAttributeNames.LABEL]: "Rectangle",
        [PCSourceAttributeNames.NATIVE_TYPE]: "div"
      }
    },
    children: []
  }, targetSourceNodeId, 0, browser);
};

export const persistChangeNodeLabel = (label: string, targetSourceNodeId: string, browser: SyntheticBrowser) => {
  browser = persistSourceNodeChanges(targetSourceNodeId, null, browser, node => setNodeAttribute(node, "label", label));
  return browser;
};

export const persistInsertNewComponentVariant = (variantName: string, componentNodeId: string, browser: SyntheticBrowser) => {
  return persistSourceNodeChanges(componentNodeId, null, browser, (componentNode) => {
    return appendChildNode({
      name: PCSourceTagNames.COMPONENT_VARIANT,
      id: getTreeNodeUidGenerator(componentNode)(),
      attributes: {
        [DEFAULT_NAMESPACE]: {
          name: variantName,
          default: false
        }
      },
      children: []
    }, componentNode);
  });
};

export const persistSetElementVariants = (variantNames: string[], sourceNodeId: string, componentVariantName: string, browser: SyntheticBrowser) => {
  if (componentVariantName) {
    throw new Error(`cannot set variant under component`);
  }
  const componentInstanceNode = getComponentInstanceSourceNode(sourceNodeId, browser);
  return persistSourceNodeChanges(componentInstanceNode.id, null, browser, (sourceNode) => {
    return setNodeAttribute(sourceNode, PCSourceAttributeNames.VARIANTS, variantNames);
  });
};
export const persistComponentVariantChanged = (properties: Partial<ComponentVariantInfo>, name: string, componentNodeId: string, browser: SyntheticBrowser) => {
  const sourceNode = getSourceNodeById(componentNodeId, browser);
  const stateNode = sourceNode.children.find(child => getAttribute(child, "name") === name);
  return persistSourceNodeChanges(stateNode.id, null, browser, (stateNode) => {
    if (properties.isDefault != null) {
      stateNode = setNodeAttribute(stateNode, "default", properties.isDefault);
    }
    if (properties.name) {
      stateNode = setNodeAttribute(stateNode, "name", properties.name);
    }
    return stateNode;
  });
};

export const persistRemoveComponentVariant = (name: string, componentNodeId: string, browser: SyntheticBrowser) => {
  const sourceNode = getSourceNodeById(componentNodeId, browser);
  const stateNode = sourceNode.children.find(child => getAttribute(child, "name") === name);
  return persistSourceNodeChanges(sourceNode.id, null, browser, (componentNode) => {
    return removeNestedTreeNode(stateNode, componentNode);
  });
};

export const persistInsertText = (style: any, nodeValue: string, targetSourceNodeId: string, browser: SyntheticBrowser) => {
  return persistInsertNode({
    name: "text",
    attributes: {
      [DEFAULT_NAMESPACE]: {
        style,
        value: nodeValue,
        label: "Text"
      }
    },
    children: []
  }, targetSourceNodeId, 0, browser);
};


// TODO - documentId needs to be nodeId
export const persistInsertNode = (child: TreeNode, refSourceNodeId: string, offset: TreeMoveOffset, browser: SyntheticBrowser) => {
  const sourceRefNode = getSourceNodeById(refSourceNodeId, browser);
  const dep = getSourceNodeDependency(refSourceNodeId, browser);
  const sourceParentNode = offset === 0 ? sourceRefNode : getParentTreeNode(sourceRefNode.id, dep.content);
  const index = offset === 0 ? sourceParentNode.children.length : sourceParentNode.children.indexOf(sourceRefNode) + (offset === -1 ? 0 : 1);
  if (!getAttribute(child, "ref")) {
    child = setNodeAttribute(child, "ref", getTreeNodeUidGenerator(sourceParentNode)());
  }

  return updateDependencyAndRevaluate({
    content: insertComponentChildNode(addTreeNodeIds(child, dep.content.id), index, sourceParentNode.id, dep.content)
  }, dep.uri, browser);
};

const insertComponentChildNode = (child: TreeNode, index: number, parentId: string, content: TreeNode) => {
  const parentNode = getNestedTreeNodeById(parentId, content);

  const isComponent = parentNode.name === "component";
  const isChildComponent = Boolean(getAttribute(parentNode, "extends"));
  // don't allow for this kind of thing
  if (isChildComponent) {
    throw new Error(`Cannot insert node into child component`);
  }
  const parent = isComponent ? parentNode.children.find(child => child.name === "template") : parentNode;

  let newContent: TreeNode = content;
  newContent = updateNestedNode(parent, newContent, (parent) => {
    return {
      ...parent,
      children: arraySplice(parent.children, index, 0, child)
    };
  });
  return newContent;
};

export const persistConvertNodeToComponent = (nodeId: string, browser: SyntheticBrowser) => {
  const sourceNode = getSyntheticSourceNode(nodeId, browser);
  const dep = getSourceNodeDependency(sourceNode.id, browser);
  const sourceParent = getParentTreeNode(sourceNode.id, dep.content);



  const componentSourceNode: TreeNode = {
    name: "component",
    id: String(Math.random()),
    attributes: {

      // TODO - calculate best document position
      [EDITOR_NAMESPACE]: {
        left: 0,
        top: 0,
        right: 200,
        bottom: 200
      },
      [DEFAULT_NAMESPACE]: {
        id: generateComponentId(dep.content),
        label: "Untitled",
        style: sourceNode.name === "text" ? {} : getAttribute(sourceNode, "style")
      }
    },
    children: [
      {
        id: String(Math.random()),
        name: "template",
        attributes: {},
        children: sourceNode.name === "text" ? [sourceNode] : sourceNode.children
      }
    ]
  };

  browser = persistSourceNodeChanges(dep.content.id, null, browser, (content) => {
    content = replaceNestedNode({
      id: String(Math.random()),
      name: getAttribute(componentSourceNode, "id"),
      attributes: {},
      children: []
    }, sourceNode.id, content);
    content = appendChildNode(componentSourceNode, content);
    return content;
  });

  return browser;
};

export const persistDeleteSyntheticItems = (nodeIds: string[], browser: SyntheticBrowser) => {

  const updatedDepContent = {};

  nodeIds.forEach((nodeId) => {
    const syntheticNode = getSyntheticNodeById(nodeId, browser);
    if (isCreatedFromComponent(syntheticNode) && !isComponentInstance(syntheticNode)) {

      // TODO -
      console.warn(`Cannot currently delete instances of nodes`);
      return;
    }
    const sourceUri = syntheticNode.source.uri;
    const content = updatedDepContent[sourceUri] || browser.graph[sourceUri].content;
    const sourceNode = getSyntheticSourceNode(syntheticNode.id, browser);
    updatedDepContent[sourceUri] = removeNestedTreeNode(sourceNode, content);
  });

  for (const uri in updatedDepContent) {
    browser = updateDependencyAndRevaluate({
      content: updatedDepContent[uri]
    }, uri, browser);
  }

  return browser;
};

const setNodeStyle = (node: TreeNode, properties: any) => setNodeAttribute(node, "style", {
  ...(getAttribute(node, "style") || EMPTY_OBJECT),
  ...properties
});

export const persistMoveSyntheticNode = (node: SyntheticNode, targetNodeId: string, offset: 0 | -1 |  1, browser: SyntheticBrowser) => {
  let sourceNode = getSyntheticSourceNode(node.id, browser);

  const sourceDep = getSourceNodeDependency(sourceNode.id, browser);
  const componentInstanceNode = getComponentInstanceSyntheticNode(targetNodeId, getSyntheticNodeDocument(targetNodeId, browser).root);

  const sourceParent = getParentTreeNode(sourceNode.id, sourceDep.content);

  if (offset === 0) {
    const targetParent = getSyntheticNodeById(targetNodeId, browser);
    const sourceDocument = getSyntheticNodeDocument(node.id, browser);
    const destDocument = getSyntheticNodeDocument(targetNodeId, browser);
    let absoluteBounds = sourceDocument.computed[node.id].bounds;
    if (sourceDocument.computed[node.id].style.position !== "fixed") {
      absoluteBounds = convertFixedBoundsToNewAbsoluteRelativeToParent(absoluteBounds, targetParent, destDocument);
    }
    sourceNode = setNodeStyle(sourceNode, {
      left: absoluteBounds.left,
      top: absoluteBounds.top
    });
  }

  const targetSourceNode = getSyntheticSourceNode(targetNodeId, browser);
  const targetOriginSourceNode = getSyntheticOriginSourceNode(getSyntheticNodeById(targetNodeId, browser), browser);
  const targetActSourceNode = componentInstanceNode ? getSyntheticSourceNode(componentInstanceNode.id, browser) : targetSourceNode;

  // const actualtargetSourceNode = containerName ?
  browser = persistSourceNodeChanges(sourceParent.id, null, browser, parent => {
    return removeNestedTreeNode(sourceNode, parent);
  });

  if (componentInstanceNode) {
    const slotName = getAttribute(targetOriginSourceNode, PCSourceAttributeNames.CONTAINER);
    sourceNode = setNodeAttribute(sourceNode, "slot", slotName);
  }

  // TODO - point to target node id
  browser = persistInsertNode(sourceNode, targetActSourceNode.id, offset, browser);

  return browser;
};

export const isContainerSyntheticNode = (node: TreeNode) => Boolean(getAttribute(node, PCSourceAttributeNames.CONTAINER));

/**
 * This assumes that the nodes in the same parent
 */

export const getComponentInstanceSyntheticNode = (nodeId: string, root: TreeNode) => {
  const node = getNestedTreeNodeById(nodeId, root);
  const filter = (parent) => {
    return getAttribute(parent, EditorAttributeNames.IS_COMPONENT_INSTANCE, EDITOR_NAMESPACE);
  };
  if (filter(node)) {
    return node;
  }

  return findTreeNodeParent(nodeId, root, filter);
};

export const isCreatedFromComponent = (node: TreeNode) => Boolean(getAttribute(node, EditorAttributeNames.CREATED_FROM_COMPONENT, EDITOR_NAMESPACE));
export const isComponentInstance = (node: TreeNode) => Boolean(getAttribute(node, EditorAttributeNames.IS_COMPONENT_INSTANCE, EDITOR_NAMESPACE));
export const isComponent = (node: TreeNode) => Boolean(getAttribute(node, EditorAttributeNames.IS_COMPONENT_ROOT, EDITOR_NAMESPACE));

export const getComponentInstanceSourceNode = (nodeId: string, browser: SyntheticBrowser) => {
  const node = getSourceNodeById(nodeId, browser);
  const dep = getSourceNodeDependency(nodeId, browser);
  if (isComponentInstanceSourceNode(node)) {
    return node;
  }
  return findTreeNodeParent(nodeId, dep.content, isComponentInstanceSourceNode);
};

export const persistSyntheticItemPosition = (position: Point, nodeId: string, browser: SyntheticBrowser) => {
  const bounds = getSyntheticNodeBounds(nodeId, browser);
  const newBounds = convertFixedBoundsToRelative(moveBounds(bounds, position), getSyntheticNodeById(nodeId, browser), getSyntheticNodeDocument(nodeId, browser));
  return persistSyntheticItemBounds(newBounds, nodeId, browser);
};

export const getModifiedDependencies = (oldGraph: DependencyGraph, newGraph: DependencyGraph): Dependency[] => {
  return pull(Object.values(newGraph), ...(Object.values(oldGraph) as any));
};

export const persistSyntheticItemBounds = (bounds: Bounds, nodeId: string, browser: SyntheticBrowser) => {
  const sourceNodeId = getSyntheticSourceNode(nodeId, browser);
  if (isSyntheticDocumentRoot(getSyntheticNodeById(nodeId, browser))) {
    return persistSourceNodeChanges(sourceNodeId.id, null, browser, (child) => {
      return setNodeAttribute(child, "bounds", bounds, EDITOR_NAMESPACE);
    });
  } else {
    const document = getSyntheticNodeDocument(nodeId, browser);
    return persistSourceNodeChanges(sourceNodeId.id, null, browser, (child) => {
      const style = getAttribute(child, "style") || EMPTY_OBJECT;
      const pos = style.position || "relative";
      return setNodeAttribute(child, "style", {
        ...style,
        position: pos,
        left: bounds.left - document.bounds.left,
        top: bounds.top - document.bounds.top,
        width: bounds.right - bounds.left,
        height: bounds.bottom - bounds.top,
      });
    });
  }
};

export const persistRawCSSText = (text: string, nodeId: string, variantName: string, browser: SyntheticBrowser) => {
  const newStyle = parseStyle(text);
  return persistSourceNodeChanges(getSyntheticSourceNode(nodeId, browser).id, variantName, browser, (child) => {
    return setNodeAttribute(child, "style", newStyle);
  });
};

const generateContainerName = (sourceNodeId: string, browser: SyntheticBrowser) => {
  const rootSourceElement = getSourceNodeElementRoot(sourceNodeId, browser);
  return `container` + generateTreeChecksum(rootSourceElement);
};

export const persistToggleSlotContainer = (sourceNodeId: string, browser: SyntheticBrowser) => {
  const sourceNode = getSourceNodeById(sourceNodeId, browser);
  const rootSourceElement = getSourceNodeElementRoot(sourceNode.id, browser);
  return persistSourceNodeChanges(sourceNode.id, null, browser, (child) => {
    const style = getAttribute(child, "style") || EMPTY_OBJECT;
    const containerName = getAttribute(child, PCSourceAttributeNames.CONTAINER);
    if (containerName) {
      child = setNodeAttribute(child, PCSourceAttributeNames.CONTAINER, null);
      child = setNodeAttribute(child, PCSourceAttributeNames.CONTAINER_STORAGE, containerName);
      return child;
    } else {
      child = setNodeAttribute(child, PCSourceAttributeNames.CONTAINER, getAttribute(child, PCSourceAttributeNames.CONTAINER_STORAGE) || generateContainerName(sourceNode.id, browser));
    }
    return child;
  });
};

export const persistChangeNodeType = (nativeType: string, sourceNodeId: string, browser: SyntheticBrowser) => {
  return persistSourceNodeChanges(sourceNodeId, null, browser, node => setNodeAttribute(node, PCSourceAttributeNames.NATIVE_TYPE, nativeType));
};

export const persistTextValue = (value: string, sourceNodeId: string, browser: SyntheticBrowser) => {
  return persistSourceNodeChanges(sourceNodeId, null, browser, node => setNodeAttribute(node, "value", value));
};
