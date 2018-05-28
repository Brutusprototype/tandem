/**

TODO (in order of importance):

- render all components defined in a file
- attach source information to each node
- render all components loaded externally from other dependency
- component overrides

*/

import {
  TreeNode,
  TreeNodeAttributes,
  generateTreeChecksum,
  removeNestedTreeNodeFromPath,
  removeNestedTreeNode,
  getParentTreeNode,
  updateNestedNode,
  EMPTY_OBJECT,
  EMPTY_ARRAY,
  arraySplice,
  memoize,
  mergeNodeAttributes
} from "tandem-common";
import {
  Dependency,
  DependencyGraph,
  getNodeSourceComponent,
  getPCNodeModule,
  getModuleComponent,
  getPCNodeDependency,
  getImportedDependency,
  getNodeReference,
  PCModuleNode,
  PCComponentNode,
  getComponentTemplate,
  PCVisibleNodeAttributes,
  getComponentVariants,
  PCSourceTagNames,
  PCTemplateNode,
  PCBaseVisibleNode,
  PCElementAttributeNames,
  PCTextNode,
  PCSourceNamespaces,
  PCElement
} from "./dsl";
import {
  SyntheticNodeSource,
  SyntheticBrowser,
  SyntheticNode,
  SyntheticObject,
  SyntheticObjectType,
  SyntheticWindow,
  createSyntheticElement,
  getSytheticNodeSource,
  SyntheticDocument,
  getSyntheticDocumentDependency,
  EditorAttributeNames,
  getComponentInstanceSourceNode,
  createSyntheticTextNode,
  SyntheticElement
} from "./synthetic";

import { pick, merge } from "lodash";

export type EvaluateOptions = {
  entry: Dependency;
  graph: DependencyGraph;
};

export type EvaluationResult = {
  documentNodes: SyntheticNode[];
};

type Slots = {
  [identifier: string]: TreeNode<any>[];
};

type IDGenerator = () => string;

export const evaluateDependencyEntry = ({
  entry,
  graph
}: EvaluateOptions): EvaluationResult => {
  const checksum = generateTreeChecksum(entry.content);
  let i = 0;
  const generateId = () => checksum + i++;
  return {
    documentNodes: entry.content.children.map((element, i) =>
      evaluatRooteDocumentElement(element, entry, graph, generateId)
    )
  };
};

export const evaluatRooteDocumentElement = (
  element: TreeNode<any>,
  entry: Dependency,
  graph: DependencyGraph,
  generateId: IDGenerator
) => {
  if (element.name === PCSourceTagNames.COMPONENT) {
    return evaluateRootDocumentComponent(
      element as PCComponentNode,
      entry,
      graph,
      generateId
    );
  } else {
    const synthetic = evaluateNode(
      element,
      entry.content,
      generateId,
      entry,
      graph,
      null
    );

    return synthetic;
  }
};

export const evaluateRootDocumentComponent = (
  componentNode: PCComponentNode,
  currentDependency: Dependency,
  graph: DependencyGraph,
  generateId: IDGenerator
): SyntheticNode => {
  const dependency = getPCNodeDependency(
    componentNode,
    currentDependency,
    graph
  );
  let element: SyntheticElement = _evaluateComponent(
    componentNode,
    {
      [PCSourceNamespaces.CORE]: {}
    },
    [],
    getSytheticNodeSource(componentNode, dependency),
    generateId,
    currentDependency.content,
    dependency,
    graph,
    true
  );
  element = mergeNodeAttributes(element, {
    [PCSourceNamespaces.EDITOR]: {
      isComponentInstance: false,
      isComponentRoot: true
    }
  }) as SyntheticElement;
  return element;
};

const _evaluateComponent = (
  componentNode: PCComponentNode,
  attributes: PCVisibleNodeAttributes,
  children: TreeNode<any>[],
  source: SyntheticNodeSource,
  generateId: IDGenerator,
  module: PCModuleNode,
  dependency,
  graph: DependencyGraph,
  isRoot?: boolean,
  createdFromComponent?: boolean
) => {
  let template = getComponentTemplate(componentNode);
  const variants = getComponentVariants(componentNode);

  const useVariant = attributes.core.variants;

  const slots = {};

  for (const child of children) {
    const slotName = child.attributes[PCSourceNamespaces.CORE].slot;
    if (!slots[slotName]) {
      slots[slotName] = [];
    }
    slots[slotName].push(child);
  }

  let syntheticChildren = slots[componentNode.id];

  if (!syntheticChildren) {
    template = getComponentVariants(componentNode).reduce(
      (template, variant) => {
        return (variants
        ? variants.indexOf(variant.id) !== -1
        : isRoot && variant.attributes.core.isDefault)
          ? overrideComponentTemplate(template, variant.children)
          : template;
      },
      template
    );

    syntheticChildren = template
      ? template.children.map((child, i) =>
          evaluateNode(
            child,
            module,
            generateId,
            dependency,
            graph,
            slots,
            createdFromComponent
          )
        )
      : EMPTY_ARRAY;
  }

  const syntheticAttributes = merge(
    {},
    {
      [PCSourceNamespaces.CORE]: {
        label: componentNode.attributes.core.label
      },
      [PCSourceNamespaces.EDITOR]: {
        [EditorAttributeNames.CREATED_FROM_COMPONENT]: createdFromComponent,
        [EditorAttributeNames.IS_COMPONENT_INSTANCE]: createdFromComponent
      }
    },
    attributes
  );

  // TODO - pass slots down
  // TODO - check for existing component extends:importName="component"
  let element = createSyntheticElement(
    "div",
    syntheticAttributes,
    syntheticChildren,
    source,
    generateId()
  );
  return element;
};

const overrideComponentTemplate = (
  template: PCTemplateNode,
): PCTemplateNode => {
  // Deprecated. Use _native_ styles instead.

  // for (let i = 0, { length } = overrides; i < length; i++) {
  //   const override = overrides[i];
  //   if (override.name === PCSourceTagNames.SET_ATTRIBUTE) {
  //     const setAttributeOverride = override as PCSetAttributeOverrideNode;
  //     const ref = getNodeReference(
  //       setAttributeOverride.attributes.core.target,
  //       template
  //     );
  //     template = updateNestedNode(ref, template, ref =>

  //       setNodeAttribute(
  //         ref,
  //         setAttributeOverride.attributes.core.name,
  //         setAttributeOverride.attributes.core.value
  //       )
  //     );
  //   } else if (override.name === PCSourceTagNames.SET_STYLE) {
  //     const setStyleOverride = override as PCSetStyleOverrideNode;
  //     const ref = getNodeReference(
  //       setStyleOverride.attributes.core.target,
  //       template
  //     );
  //     template = updateNestedNode(ref, template, ref => {
  //       return setNodeAttribute(ref, "style", {
  //         ...(getAttribute(ref, "style") || EMPTY_OBJECT),
  //         [setStyleOverride.attributes.core.name]:
  //           setStyleOverride.attributes.core.value
  //       });
  //     });
  //   }
  // }

  return template;
};

const evaluateNode = (
  node: PCBaseVisibleNode<any, any>,
  module: PCModuleNode,
  generateId: IDGenerator,
  dependency: Dependency,
  graph: DependencyGraph,
  slots: Slots = EMPTY_OBJECT,
  createdFromComponent?: boolean
) => {
  const nodeDependency = getPCNodeDependency(node, dependency, graph);
  const nodeComponent = getModuleComponent(node.name, module);

  let { children, attributes } = node;

  let tagName = node.name;
  let hasSlottedChildren = false;
  const containerName = node.attributes.core.container;
  const source = getSytheticNodeSource(node, dependency);

  if (containerName) {
    const slotChildren = slots[containerName] || EMPTY_ARRAY;

    if (slotChildren.length > 0) {
      children = slotChildren;
      hasSlottedChildren = true;
    }
  }

  if (node.name === PCSourceTagNames.TEXT) {
    return createSyntheticTextNode(
      {
        [PCSourceNamespaces.CORE]: (node as PCTextNode).attributes.core,
        [PCSourceNamespaces.EDITOR]: {}
      },
      source,
      generateId()
    );
  }

  const children2 = hasSlottedChildren
    ? children
    : children.map((child, i) =>
        evaluateNode(
          child,
          module,
          generateId,
          dependency,
          graph,
          slots,
          createdFromComponent
        )
      );

  if (nodeComponent) {
    return _evaluateComponent(
      nodeComponent,
      node.attributes,
      children2,
      source,
      generateId,
      module,
      nodeDependency,
      graph,
      EMPTY_ARRAY,
      false,
      true
    );
  }

  return createSyntheticElement(
    tagName,
    merge({}, attributes, {
      [PCSourceNamespaces.CORE]: {},
      [PCSourceNamespaces.EDITOR]: {
        [EditorAttributeNames.CREATED_FROM_COMPONENT]: createdFromComponent
      }
    }),
    children2,
    source,
    generateId()
  );
};
