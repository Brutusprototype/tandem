import { memoize } from "../common/utils";

export type TreeNodeAttribute = {
  namespace: string;
  name: string;
  value: string;
};

export type TreeNode = {
  children: TreeNode[];
  name: string;
  namespace?: string;
  attributes: TreeNodeAttribute[]
};

export type NodeFilter = (node: TreeNode) => boolean;

export const findNestedNode = memoize((current: TreeNode, filter: NodeFilter) => {
  if (filter(current)) {
    return current;
  }
  const {children} = current;
  for (let i = 0, {length} = children; i < length; i++) {
    const foundChild = findNestedNode(current, filter);
    if (foundChild) {
      return foundChild;
    }
  }
});

export const createNodeNameMatcher = memoize((name: string, namespace?: string) => node => node.name
 === name && node.namespace == namespace);

export const filterNestedNodes = memoize((current: TreeNode, filter: NodeFilter, found: TreeNode[] = []) => {
  if (filter(current)) {
    found.push(current);
  }
  const {children} = current;
  for (let i = 0, {length} = children; i < length; i++) {
    filterNestedNodes(current.children[i], filter, found);
  }
  return found;
});

export const getAttributesWithNamespace = memoize((current: TreeNode, namespace: string) => current.attributes.filter(attribute => attribute.namespace === namespace));

export const getAttribute = memoize((current: TreeNode, name: string, namespace?: string) => current.attributes.find(attr => attr.name === name && attr.namespace == namespace));

export const getAttributeValue = (current: TreeNode, name: string, namespace?: string) => {
  const attr = getAttribute(current, name, namespace);
  return attr && attr.value;
};

export const getChildParentMap = memoize((current: TreeNode): Map<TreeNode, TreeNode> => {
  let parentChildMap: Map<TreeNode, TreeNode> = new Map();
  for (let i = current.children.length; i--;) {
    parentChildMap.set(current.children[i], current);
    const nestedMap = getChildParentMap(current.children[i]);
    for (const [nc, np] of Array.from(nestedMap.entries())) {
      parentChildMap.set(nc, np);
    }
  }
  return parentChildMap;
});

export const getTeeNodePath = memoize((node: TreeNode, root: TreeNode) => {
  const childParentMap = getChildParentMap(root);
  let current = node;
  const path: number[] = [];
  while(1) {
    const parent = childParentMap.get(current);
    if (!parent) break;
    path.push(parent.children.indexOf(current));
    current = parent;
  }
  return path;
});