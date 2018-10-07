import { memoize, KeyValue, getParentTreeNode } from "tandem-common";
import { defaults, pick } from "lodash";
import {
  InspectorNode,
  getInspectorNodeOverrides,
  getInspectorNodeByAssocId,
  InspectorTreeNodeName
} from "./inspector";
import {
  PCComponent,
  PCVisibleNode,
  PCStyleOverride,
  getPCNode,
  PCNode,
  extendsComponent,
  PCVariant,
  PCElement,
  isPCComponentInstance,
  PCOverridablePropertyName,
  isPCComponentOrInstance,
  PCStyleMixin,
  getSortedStyleMixinIds,
  getPCNodeModule,
  INHERITABLE_STYLE_NAMES,
  PCSourceTagNames
} from "./dsl";

import { DependencyGraph } from "./graph";

export type ComputeStyleOptions = {
  styleMixins?: boolean;
  inheritedStyles?: boolean;
  overrides?: boolean;
  parentStyles?: boolean;
  self?: boolean;
};

const DEFAULT_COMPUTE_STYLE_OPTIONS: ComputeStyleOptions = {
  styleMixins: true,
  inheritedStyles: true,
  overrides: true,
  parentStyles: true,
  self: true
};

export type ComputedStyleInfo = {
  sourceNode: PCNode;
  styleOverridesMap: KeyValue<PCStyleOverride[]>;
  style: {
    [identifier: string]: string;
  };
};

// TODO - take single inspector node and use merging function instead of taking
// array here.
export const computeStyleInfo = memoize(
  (
    inspectorNode: InspectorNode,
    rootInspectorNode: InspectorNode,
    variant: PCVariant,
    graph: DependencyGraph,
    options: ComputeStyleOptions = DEFAULT_COMPUTE_STYLE_OPTIONS
  ): ComputedStyleInfo => {
    let style = {};
    const styleOverridesMap: KeyValue<PCStyleOverride[]> = {};

    const sourceNode = getPCNode(inspectorNode.assocSourceNodeId, graph) as
      | PCVisibleNode
      | PCComponent;
    const module = getPCNodeModule(sourceNode.id, graph);
    let current: PCNode = sourceNode;

    if (options.parentStyles !== false) {
      while (extendsComponent(current)) {
        const parent: PCElement = getPCNode(
          (current as PCComponent).is,
          graph
        ) as PCElement;
        if (isPCComponentOrInstance(parent)) {
          // defaults -- parents cannot disable
          defaults(style, parent.style);
        }
        current = parent;
      }
    }

    if (options.self !== false) {
      Object.assign(style, sourceNode.style);
    }

    if (options.styleMixins !== false && sourceNode.styleMixins) {
      defaults(
        style,
        computeMixinStyle(sourceNode as PCVisibleNode, graph, false)
      );
    }

    if (options.overrides !== false) {
      const overrides = getInspectorNodeOverrides(
        inspectorNode,
        rootInspectorNode,
        variant,
        graph
      );

      for (const override of overrides) {
        if (override.propertyName === PCOverridablePropertyName.STYLE) {
          for (const key in override.value) {
            if (!styleOverridesMap[key]) {
              styleOverridesMap[key] = [];
            }
            styleOverridesMap[key].push(override);
            style[key] = override.value[key];
          }
        }
      }
    }
    if (options.inheritedStyles !== false) {
      let parent = getParentTreeNode(
        inspectorNode.id,
        rootInspectorNode
      ) as InspectorNode;
      while (parent) {
        if (parent.name === InspectorTreeNodeName.SOURCE_REP) {
          const parentSource = getPCNode(
            parent.assocSourceNodeId,
            graph
          ) as PCVisibleNode;
          if (parentSource.name === PCSourceTagNames.ELEMENT) {
            defaults(
              style,
              pick(
                computeStyleInfo(parent, rootInspectorNode, variant, graph)
                  .style,
                INHERITABLE_STYLE_NAMES
              )
            );
          }
        }
        parent = getParentTreeNode(
          parent.id,
          rootInspectorNode
        ) as InspectorNode;
      }
    }

    return {
      sourceNode,
      styleOverridesMap,
      style
    };
  }
);

const computeMixinStyle = (
  node: PCVisibleNode | PCStyleMixin,
  graph: DependencyGraph,
  includeSelf?: boolean
) => {
  let style = {};
  if (includeSelf) {
    Object.assign(style, node.style);
  }
  if (node.styleMixins) {
    const sortedStyleMixinIds = getSortedStyleMixinIds(node);
    for (const styleMixinId of sortedStyleMixinIds) {
      const styleMixin = getPCNode(styleMixinId, graph) as PCStyleMixin;

      // may have been deleted by user
      if (!styleMixin) {
        continue;
      }
      defaults(style, computeMixinStyle(styleMixin, graph, true));
    }
  }
  return style;
};

const toArray = memoize(<TValue>(value: TValue) => [value]);
