import {
  memoize,
  EMPTY_OBJECT,
  EMPTY_ARRAY,
  parseStyle,
  TreeNode,
  filterNestedNodes,
  createNodeNameMatcher,
  findNestedNode,
  Bounds,
  TreeNodeAttributes,
  createTreeNode,
  generateUID,
  mergeNodeAttributes
} from "tandem-common";
import { mapValues } from "lodash";

export type DependencyGraph = {
  [identifier: string]: Dependency;
};

export type Dependency = {
  // URI used here since it could be a url
  uri: string;
  dirty?: boolean; // TRUE if the contents have changed
  originalContent: PCModuleNode;
  content: PCModuleNode;
  importUris: {
    [identifier: string]: string;
  };
};

export enum PCSourceNamespaces {
  IMPORT = "import",
  CORE = "core",
  EDITOR = "editor"
}

export enum PCSourceTagNames {
  MODULE = "module",
  COMPONENT = "component",
  TEMPLATE = "template",
  RECTANGLE = "rectangle",
  VARIANT = "variant",
  TEXT = "text",
  COMPONENT_VARIANT = "variant",
  SET_STYLE = "set-style",
  SET_ATTRIBUTE = "set-attribute"
}

type PCBaseSourceNode<
  TName extends string,
  TAttributes extends TreeNodeAttributes,
  TChild = PCBaseSourceNode<any, any, any>
> = {
  children: TChild[];
} & TreeNode<TName, TAttributes>;

export const isComponentInstanceSourceNode = (sourceNode: TreeNode<any, any>) =>
  sourceNode.name !== PCSourceTagNames.TEXT &&
  sourceNode.name !== PCSourceTagNames.RECTANGLE;

export type PCSetAttributeOverrideNodeAttributes = {
  [PCSourceNamespaces.CORE]: {
    target?: string;
    name: string;
    namespace?: string;
    value: string;
  };
};

export type PCSetAttributeOverrideNode = PCBaseSourceNode<
  PCSourceTagNames.SET_ATTRIBUTE,
  PCSetAttributeOverrideNodeAttributes
>;

export type PCSetStyleOverrideNodeAttributes = {
  [PCSourceNamespaces.CORE]: {
    target?: string;
    name: string;
    value: string;
  };
};

export type PCSetStyleOverrideNode = PCBaseSourceNode<
  PCSourceTagNames.SET_STYLE,
  PCSetStyleOverrideNodeAttributes
>;
export type PCOverrideNode =
  | PCSetAttributeOverrideNode
  | PCSetStyleOverrideNode;

export type PCVariantNodeAttributes = {
  [PCSourceNamespaces.CORE]: {
    name: string;
    isDefault?: boolean;
  };
};

export type PCVariantNode = PCBaseSourceNode<
  PCSourceTagNames.VARIANT,
  PCVariantNodeAttributes,
  PCOverrideNode
>;

export type PCVisibleNodeAttributes = {
  [PCSourceNamespaces.CORE]: {
    variants?: string[];
    slot?: string;
    style?: any;
    container?: string;
    containerStorage?: string;
    label?: string;
  };
};

export type PCBaseVisibleNode<
  TName extends string,
  TAttributes extends PCVisibleNodeAttributes
> = PCBaseSourceNode<
  TName,
  TAttributes,
  PCBaseSourceNode<any, PCVisibleNodeAttributes>
>;

export enum PCRectangleNodeAttributeNames {
  NATIVE_TYPE = "nativeType"
}

export type PCRectangleNodeAttributes = {
  [PCSourceNamespaces.CORE]: {
    [PCRectangleNodeAttributeNames.NATIVE_TYPE]?: string;
  };
} & PCVisibleNodeAttributes;

export type PCRectangleNode = PCBaseVisibleNode<
  PCSourceTagNames.RECTANGLE,
  PCRectangleNodeAttributes
>;

export type PCTextNodeAttributes = {
  [PCSourceNamespaces.CORE]: {
    value: string;
  };
} & PCVisibleNodeAttributes;

export type PCTextNode = PCBaseVisibleNode<
  PCSourceTagNames.TEXT,
  PCTextNodeAttributes
>;
export type PCVisibleNode = PCBaseVisibleNode<
  any,
  PCTextNodeAttributes | PCRectangleNodeAttributes
>;

export type PCVisibleRootNode = PCBaseVisibleNode<
  any,
  (PCTextNodeAttributes | PCRectangleNodeAttributes) & {
    [PCSourceNamespaces.EDITOR]: {
      bounds: Bounds;
    };
  }
>;

export type PCTemplateNode = PCBaseSourceNode<
  PCSourceTagNames.TEMPLATE,
  PCRectangleNodeAttributes,
  PCVisibleNode
>;

export type PCComponentAttributes = {
  [PCSourceNamespaces.EDITOR]: {
    bounds: Bounds;
  };
  [PCSourceNamespaces.CORE]: {
    label?: string;
    ref?: string;
    container?: string;

    // TODO - switch to name
    id?: string; // identifier
    style: any;
  };
};

export type PCComponentNode = PCBaseSourceNode<
  PCSourceTagNames.COMPONENT,
  PCComponentAttributes,
  PCTemplateNode | PCVariantNode
>;

export type PCModuleAttributes = {
  [PCSourceNamespaces.XMLNS]: {
    [identifier: string]: string;
  };
} & TreeNodeAttributes;

export type PCModuleNode = PCBaseSourceNode<
  PCSourceTagNames.MODULE,
  PCModuleAttributes,
  PCComponentNode | PCBaseVisibleNode<any, any>
>;

export type PCSourceNode = TreeNode<
  any,
  | PCModuleAttributes
  | PCComponentAttributes
  | PCVariantNodeAttributes
  | PCRectangleNodeAttributes
  | PCTextNodeAttributes
  | PCSetStyleOverrideNodeAttributes
  | PCSetAttributeOverrideNodeAttributes
>;

export const createPCRectangle = (
  attributes: PCRectangleNodeAttributes,
  children: PCBaseVisibleNode<any, any>[] = []
): PCRectangleNode => ({
  id: generateUID(),
  name: PCSourceTagNames.RECTANGLE,
  attributes,
  children
});

export const createPCTextNode = (
  attributes: PCTextNodeAttributes
): PCTextNode => ({
  id: generateUID(),
  name: PCSourceTagNames.TEXT,
  attributes,
  children: []
});

export const createPCTemplate = (
  children: PCBaseVisibleNode<any, any>[] = []
): PCTemplateNode => ({
  id: generateUID(),
  name: PCSourceTagNames.TEMPLATE,
  namespace: PCSourceNamespaces.CORE,
  children: [],
  attributes: {
    [PCSourceNamespaces.CORE]: {}
  }
});

export const createPCComponent = (
  attributes: PCComponentAttributes,
  template?: PCTemplateNode
): PCComponentNode => ({
  id: generateUID(),
  name: PCSourceTagNames.COMPONENT,
  namespace: PCSourceNamespaces.CORE,
  attributes,
  children: [template || createPCTemplate()]
});

export const createPCVariant = (
  attributes: PCVariantNodeAttributes
): PCVariantNode => ({
  id: generateUID(),
  name: PCSourceTagNames.VARIANT,
  namespace: PCSourceNamespaces.CORE,
  attributes,
  children: []
});

/**
 * Returns all components in a module
 */

export const getModuleComponents = memoize(
  (root: PCModuleNode): PCComponentNode[] =>
    (filterNestedNodes(
      root,
      node => node.name === PCSourceTagNames.COMPONENT
    ) as any) as PCComponentNode[]
);

export const getImportedDependency = (
  namespace: string,
  dependency: Dependency,
  graph: DependencyGraph
) => {
  const module = dependency.content as PCModuleNode;
  const importedPath =
    dependency.importUris[
      module.attributes.xmlns && module.attributes.xmlns[namespace]
    ];
  return importedPath ? graph[importedPath] : dependency;
};

export const getNodeSourceDependency = (
  node: PCBaseSourceNode<any, any>,
  currentDependency: Dependency,
  graph: DependencyGraph
) => getImportedDependency(node.namespace, currentDependency, graph);

export const getNodeSourceModule = (
  node: PCBaseSourceNode<any, any>,
  dependency: Dependency,
  graph: DependencyGraph
) => {
  const sourceDependency = getNodeSourceDependency(node, dependency, graph);
  return sourceDependency.content as PCModuleNode;
};

export const getModuleComponent = (componentId: string, module: PCModuleNode) =>
  module.children.find(
    component =>
      component.name === PCSourceTagNames.COMPONENT &&
      (component as PCComponentNode).attributes.core.id === componentId
  ) as PCComponentNode;

export const getComponentTemplate = (component: PCComponentNode) =>
  component.children.find(
    child => child.name === PCSourceTagNames.TEMPLATE
  ) as PCTemplateNode;
export const getComponentVariants = (component: PCComponentNode) =>
  component.children.filter(
    child => child.name === PCSourceTagNames.VARIANT
  ) as PCVariantNode[];
export const getNodeSourceComponent = memoize(
  (
    node: PCBaseSourceNode<any, any>,
    dependency: Dependency,
    graph: DependencyGraph
  ) =>
    getModuleComponent(node.name, getNodeSourceModule(node, dependency, graph))
);

export const getNodeReference = memoize((refName: string, root: PCSourceNode) =>
  findNestedNode(
    root,
    (child: PCComponentNode) => child.attributes.core.ref === refName
  )
);

export const updateGraphDependency = (
  properties: Partial<Dependency>,
  uri: string,
  graph: DependencyGraph
) => ({
  ...graph,
  [uri]: {
    ...graph[uri],
    ...properties
  }
});

export const getDependents = memoize((uri: string, graph: DependencyGraph) => {
  const dependents = [];

  for (const depUri in graph) {
    if (depUri === uri) {
      continue;
    }

    const dep = graph[depUri];

    for (const relativePath in dep.importUris) {
      const importedUri = dep.importUris[relativePath];
      if (importedUri === uri) {
        dependents.push(dep);
        continue;
      }
    }
  }

  return dependents;
});

export const getModuleImportNamespace = (
  uri: string,
  moduleNode: PCModuleNode
): string => {
  for (const namespace in moduleNode.attributes.xmlns) {
    if (moduleNode.attributes.xmlns[namespace] === uri) {
      return namespace;
    }
  }
};

export const addModuleNodeImport = (
  uri: string,
  moduleNode: PCModuleNode
): PCModuleNode => {
  const namespace = getModuleImportNamespace(uri, moduleNode);
  if (namespace) return moduleNode;
  const imports = moduleNode.attributes.xmlns || {};
  const importCount = Object.keys(imports).length;
  return mergeNodeAttributes(moduleNode, {
    xmlns: {
      ["import" + importCount]: uri
    }
  });
};
