import {
  memoize,
  generateUID,
  getTreeNodesByName,
  KeyValue
} from "tandem-common";
import {
  PCNode,
  getOverrideMap,
  PCOverridablePropertyName,
  PCTextNode,
  PCBaseElementChild,
  isVisibleNode,
  PCComputedOverrideVariantMap,
  PCComponentInstanceElement,
  PCBaseElement,
  PCComponent,
  getOverrides,
  PCVisibleNode,
  PCSourceTagNames,
  extendsComponent,
  computePCNodeStyle,
  PCModule
} from "./dsl";
import { SyntheticElement } from "./synthetic";

export type VanillaPCRenderers = KeyValue<VanillaPCRenderer>;
export type VanillaPCRenderer = (
  instanceSourceNodeId: string,
  attributes: any,
  style: any,
  overrides: any,
  components: VanillaPCRenderers
) => SyntheticElement;

// Note: we're not using immutability here because this thing needs to be _fast_

export const compileContentNodeAsVanilla = memoize(
  (node: PCComponent | PCVisibleNode, refMap: KeyValue<PCComponent>) => {
    return new Function(
      `generateUID`,
      `return ` + translateContentNode(node, refMap)
    )(generateUID);
  }
);

export const translateModuleToVanilla = memoize(
  (module: PCModule, componentRefMap: KeyValue<PCComponent>) => {
    return module.children
      .map(
        child =>
          `exports._${child.id} = ${translateContentNode(
            child,
            componentRefMap
          )}`
      )
      .join("\n");
  }
);

const translateContentNode = memoize(
  (
    node: PCComponent | PCVisibleNode,
    componentRefMap: KeyValue<PCComponent>
  ) => {
    let buffer = `(function() {`;

    buffer += `var EMPTY_ARRAY = [];\n`;
    buffer += `var EMPTY_OBJECT = {};\n`;
    buffer += translateStaticNodeProps(node, componentRefMap);
    buffer += translateStaticOverrides(node);

    buffer += `return function(instanceSourceNodeId, attributes, style, overrides, components) {
      return ${translateVisibleNode(node, true)};
    }`;

    return buffer + `})()`;
  }
);

const isBaseElement = (node: PCNode): node is PCBaseElement<any> =>
  node.name === PCSourceTagNames.ELEMENT ||
  node.name === PCSourceTagNames.COMPONENT ||
  node.name === PCSourceTagNames.COMPONENT_INSTANCE;

const translateVisibleNode = memoize(
  (node: PCComponent | PCVisibleNode, isContentNode?: boolean) => {
    if (isBaseElement(node)) {
      if (extendsComponent(node)) {
        return `components._${node.is}("${
          node.id
        }", ${translateDynamicAttributes(
          node,
          isContentNode
        )}, ${translateDynamicStyle(
          node,
          isContentNode
        )}, ${translateDynamicOverrides(node as PCComponent)}, components)`;
      }

      return `{
      id: generateUID(),
      sourceNodeId: ${isContentNode ? "instanceSourceNodeId" : `"${node.id}"`},
      name: "${node.is}",
      style: ${translateDynamicStyle(node, isContentNode)},
      metadata: EMPTY_OBJECT,
      attributes: ${translateDynamicAttributes(node, isContentNode)},
      children: [${node.children
        .map(translateElementChild)
        .filter(Boolean)
        .join(",")}]
    }`;
    } else if (node.name === PCSourceTagNames.TEXT) {
      return `{
      id: generateUID(),
      sourceNodeId: "${node.id}",
      style: ${translateDynamicStyle(node, isContentNode)},
      metadata: EMPTY_OBJECT,
      name: "text",
      value: overrides._${node.id}Value || ${JSON.stringify(node.value)},
      children: EMPTY_ARRAY
    }`;
    }
  }
);

const translateElementChild = memoize((node: PCBaseElementChild) => {
  if (node.name === PCSourceTagNames.SLOT) {
    return `...(overrides._${node.id}Children || [${node.children
      .map(translateElementChild)
      .filter(Boolean)
      .join(",")}])`;
  } else if (isVisibleNode(node)) {
    return translateVisibleNode(node);
  } else {
    // console.warn(`Cannot compile ${node.name}`);
  }
});

const translateDynamicAttributes = (
  node: PCBaseElement<any>,
  isContentNode: boolean
) => {
  if (isContentNode) {
    return `overrides._${node.id}Attributes ? Object.assign({}, _${
      node.id
    }Attributes, overrides._${
      node.id
    }Attributes, attributes) : Object.assign({}, _${
      node.id
    }Attributes, attributes)`;
  }

  return `overrides._${node.id}Attributes ? Object.assign({}, _${
    node.id
  }Attributes, overrides._${node.id}Attributes) : _${node.id}Attributes`;
};

const translateDynamicStyle = (
  node: PCBaseElement<any> | PCTextNode,
  isContentNode: boolean
) => {
  if (isContentNode) {
    return `overrides._${node.id}Style ? Object.assign({}, _${
      node.id
    }Style, overrides._${node.id}Style, style) : Object.assign({}, _${
      node.id
    }Style, style)`;
  }

  return `overrides._${node.id}Style ? Object.assign({},  _${
    node.id
  }Style, overrides._${node.id}Style) : _${node.id}Style`;
};

const translateDynamicOverrides = (
  node: PCComponent | PCComponentInstanceElement
) => {
  let buffer = `Object.assign({}, overrides._${node.id}Overrides, _${
    node.id
  }Overrides._default, {`;

  for (const child of node.children as PCNode[]) {
    if (child.name === PCSourceTagNames.PLUG) {
      buffer += `_${child.slotId}Children: [${child.children
        .map(translateElementChild)
        .filter(Boolean)
        .join(",")}],\n`;
    }
  }

  return buffer + `})`;
};

const translateStaticOverrides = (node: PCNode) => {
  const instances = [
    ...getTreeNodesByName(PCSourceTagNames.COMPONENT_INSTANCE, node),
    ...getTreeNodesByName(PCSourceTagNames.COMPONENT, node)
  ];
  return instances.map(translateComponentInstanceOverrides).join("\n");
};

const translateComponentInstanceOverrides = memoize(
  (instance: PCComponentInstanceElement) => {
    const overrides = getOverrides(instance);
    const overrideMap = getOverrideMap(overrides);
    let buffer = `var _${instance.id}Overrides = {`;

    for (const variantId in overrideMap) {
      buffer += `_${variantId}: {${translateVariantOverrideMap(
        overrideMap[variantId]
      )}},\n`;
    }

    return buffer + `};\n`;
  }
);

const translateVariantOverrideMap = memoize(
  (map: PCComputedOverrideVariantMap) => {
    let buffer = ``;
    for (const nodeId in map) {
      const { overrides, children: childMap } = map[nodeId];

      for (const override of overrides) {
        const targetId =
          override.targetIdPath[override.targetIdPath.length - 1];
        if (override.propertyName === PCOverridablePropertyName.STYLE) {
          buffer += `_${targetId}Style: ${JSON.stringify(override.value)},`;
        }
        if (override.propertyName === PCOverridablePropertyName.ATTRIBUTES) {
          buffer += `_${targetId}Attributes: ${JSON.stringify(
            override.value
          )},`;
        }
        if (override.propertyName === PCOverridablePropertyName.TEXT) {
          buffer += `_${targetId}Value: ${JSON.stringify(override.value)},`;
        }
      }
      buffer += `_${nodeId}Overrides: {`;

      buffer += translateVariantOverrideMap(childMap);

      buffer += `},`;
    }

    return buffer + ``;
  }
);

const translateStaticNodeProps = memoize(
  (node: PCNode, componentRefMap: KeyValue<PCComponent>) => {
    let buffer = "";

    if (isBaseElement(node)) {
      buffer += `var _${node.id}Attributes = {\n`;
      for (const name in node.attributes) {
        buffer += `"${name}": "${node.attributes[name]}",\n`;
      }
      buffer += `};\n`;
    }

    if (isBaseElement(node) || node.name === PCSourceTagNames.TEXT) {
      buffer += `var _${node.id}Style = ${JSON.stringify(
        computePCNodeStyle(node, componentRefMap)
      )};`;
    }

    for (const child of node.children) {
      buffer += translateStaticNodeProps(child, componentRefMap);
    }

    return buffer;
  }
);
