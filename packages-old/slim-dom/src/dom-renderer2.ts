import { SlimBaseNode, SlimParentNode, SlimVMObjectType, SlimCSSAtRule, SlimCSSGroupingRule, SlimCSSRule, SlimCSSStyleDeclaration, SlimCSSStyleRule, SlimCSSStyleSheet, SlimElement, SlimElementAttribute, SlimFragment, SlimStyleElement, SlimTextNode, SlimWindow, VMObjectSource, VMObject, SlimFontFace } from "./state";
import { getAttributeValue, getVMObjectFromPath, compileScopedCSS, getSlot, getNodeSlotName, getSlotChildren, getSlotChildrenByName, getVMObjectPath, getVMObjectIdType, setCSSStyleProperty, removeCSSStyleProperty, getStyleValue, insertCSSStyleProperty, setElementAttribute, setElementAttributeAt, removeElementAttributeAt, insertElementAttributeAt, moveElementAttribute } from "./utils";
import { DOMNodeMap, ComputedDOMInfo } from "./dom-renderer";
import { Mutation, InsertChildMutation, RemoveChildMutation, SetPropertyMutation, SetValueMutation, MoveChildMutation } from "source-mutation";
import { REMOVE_CHILD_NODE, INSERT_CHILD_NODE, CSS_AT_RULE_SET_PARAMS, CSS_DELETE_RULE, CSS_INSERT_RULE, CSS_MOVE_RULE, CSS_SET_SELECTOR_TEXT, CSS_SET_STYLE_PROPERTY, ATTACH_SHADOW, REMOVE_SHADOW, SET_ATTRIBUTE, REMOVE_ATTRIBUTE, INSERT_ATTRIBUTE, MOVE_CHILD_NODE, SET_TEXT_NODE_VALUE, patchNode2, CSS_DELETE_STYLE_PROPERTY, CSS_INSERT_STYLE_PROPERTY, MOVE_ATTRIBUTE } from "./diff-patch";
import { weakMemo } from "./weak-memo";

export type DOMMap = {
  [identifier: string]: Node
};

export type CSSOMMap = {
  [identifier: string]: CSSStyleRule|CSSGroupingRule|CSSStyleSheet|CSSKeyframesRule
};

export type NativeObjectMap = {
  dom: DOMMap;
  cssom: CSSOMMap;
}

export const renderDOM2 = (object: VMObject, root: HTMLElement): NativeObjectMap => {
  const domMap: DOMMap = { [object.id]: root };
  const cssomMap: CSSOMMap = {};
  insertStyleSheets(object as SlimParentNode, root, { map: { dom: domMap, cssom: cssomMap } });
  root.appendChild(createNativeNode(object, root.ownerDocument, { map: domMap, root: object as SlimParentNode }));
  return { dom: domMap, cssom: cssomMap };
};

type CreateNativeNodeContext = {
  host?: SlimElement;
  root: SlimParentNode;
  map: DOMMap;
};

type InsertStyleSheetContext = {
  scope?: string;
  host?: SlimElement;
  map: NativeObjectMap
};

const createNativeNode = (vmNode: VMObject, document: Document, context: CreateNativeNodeContext): Node => {
  switch(vmNode.type) {
    case SlimVMObjectType.ELEMENT: {
      const { tagName, type, id, shadow, childNodes, attributes } = vmNode as SlimElement;
      
      if (tagName === "style") {
        return null;
      }

      if (tagName === "slot") {

        // Note that document fragment is necessary for slots to ensure that that certain props are inheritable from the parent (like display: flex)
        const slotElement = document.createDocumentFragment();

        // add a marker so that elements can be dynamically inserted when patched
        slotElement.appendChild(context.map[vmNode.id] = document.createComment("section-start"));

        const host = context.host;

        if (host) {
          const slotName = getAttributeValue("name", vmNode as SlimElement);
          const slotChildNodes = getSlotChildrenByName(slotName, host);
          
          for (let i = 0, {length} = slotChildNodes; i < length; i++) {
            const child = slotChildNodes[i];
            const nativeChild = createNativeNode(child, document, {
              ...context,
              host: getNodeHost(child, context.root as SlimParentNode)
            });
            slotElement.appendChild(nativeChild);
          }
        }

        // append default slot element children
        if (slotElement.childNodes.length === 1) {
          appendNativeChildNodes(vmNode as SlimParentNode, slotElement, document,  context)
        }

        slotElement.appendChild(document.createComment("section-end"));


        return  slotElement;
      }
      
      const nativeElement = context.map[vmNode.id] = document.createElement(tagName);

      for (let i = 0, {length} = attributes; i < length; i++) {
        const attribute = attributes[i];
        setNativeElementAttribute(nativeElement, attribute.name, attribute.value);
      }
      if (context.host) {
        nativeElement.classList.add(getElementScopeTagName(context.host));
      }
      
      if (shadow) {
        nativeElement.classList.add(getElementScopeTagName(vmNode as SlimElement) + "_host");
      }

      if (shadow) {
        context.map[shadow.id] = nativeElement;
        const nativeShadow = createNativeNode(shadow, document, {
          ...context,
          host: vmNode as SlimElement
        });
        // TODO - get slots
        nativeElement.appendChild(nativeShadow);
      } else {
        appendNativeChildNodes(vmNode as SlimParentNode, nativeElement, document,  context)
      }
      return nativeElement;
    }
    case SlimVMObjectType.TEXT: {
      const textNode = vmNode as SlimTextNode;
      return context.map[textNode.id] = document.createTextNode(textNode.value);
    }
    case SlimVMObjectType.DOCUMENT: 
    case SlimVMObjectType.DOCUMENT_FRAGMENT: {
      const fragment = document.createDocumentFragment();
      appendNativeChildNodes(vmNode as SlimParentNode, fragment, document,  context)
      return fragment;
    }
  }
  return null;
};

const createParentChildNodes = (parent: SlimParentNode, document: Document, context: CreateNativeNodeContext) => {
  parent.childNodes.map(child => createNativeNode(parent, document, context));
}

const insertStyleSheets = (current: VMObject, mount: HTMLElement, context: InsertStyleSheetContext) => {
  if (current.type === SlimVMObjectType.ELEMENT) {
    const element = current as SlimElement;
    if (element.tagName === "style") {
      insertStyleSheet(element as SlimStyleElement, mount, context);
    } else if (element.shadow) {
      insertStyleSheets(element.shadow, mount, {
        ...context,
        host: element
      });
    }
  }
  if ((current as SlimParentNode).childNodes) {
    const parent = current as SlimParentNode;
    for (let i = 0, {length} = parent.childNodes; i < length; i++) {
      insertStyleSheets(parent.childNodes[i], mount, context);
    }
  }
};

const insertStyleSheet = (element: SlimStyleElement, mount: HTMLElement, context: InsertStyleSheetContext, index: number = Number.MAX_SAFE_INTEGER) => {
  const nativeElement = mount.ownerDocument.createElement("style");
  context.map.dom[element.id] = nativeElement;
  nativeElement.appendChild(mount.ownerDocument.createTextNode(""));
  insertNativeNode(nativeElement, index, mount);
  const sheet = nativeElement.sheet as CSSStyleSheet;

  context.map.cssom[element.sheet.id] = sheet;
  const scope = getAttributeValue("scope", element);
  insertChildRules(element.sheet, sheet, { ...context, scope });
};

const insertChildRules = (slimRule: SlimCSSGroupingRule, nativeRule: CSSGroupingRule|CSSStyleSheet|CSSKeyframesRule, context: InsertStyleSheetContext) => {
  for (let i = 0, {length} = slimRule.rules; i < length; i++) {
    insertChildRule(slimRule.rules[i], nativeRule, context, i);  
  }
};

const insertChildRule = (slimRule: SlimCSSRule, nativeRule: CSSGroupingRule|CSSStyleSheet|CSSKeyframesRule, context: InsertStyleSheetContext, index: number) => {
  

  index = Math.min(index, nativeRule.cssRules.length);

  let childRuleText = shallowStringifyRule(slimRule, context);

  while(1) {
    try {
      if ((nativeRule as any).insertRule) {
        (nativeRule as any).insertRule(childRuleText, index);
      } else {
        (nativeRule as any).appendRule(childRuleText, index);
      }
    } catch(e) {

      console.warn(`Unable to insert ${childRuleText} style. Inserting placeholder rule.`);
      console.warn(e.stack);

      if (slimRule.type === SlimVMObjectType.STYLE_RULE) {
        childRuleText = `.___placeholder {}`;
      } else if (slimRule.type === SlimVMObjectType.AT_RULE) {
        childRuleText = `@media screen and (min-width: 999999999px) { }`
      }
      
      continue;
    }
    break;
  }

  context.map.cssom[slimRule.id] = nativeRule.cssRules[index] as any;

  if ((slimRule as SlimCSSGroupingRule).rules) {
    insertChildRules(slimRule as SlimCSSGroupingRule, context.map.cssom[slimRule.id] as any, context);
  }
};

const shallowStringifyRule = (rule: SlimCSSRule, context: InsertStyleSheetContext) => {
  switch(rule.type) {
    case SlimVMObjectType.STYLE_RULE: {
      const { selectorText, style } = rule as SlimCSSStyleRule;
      // console.log(stringifyScopedSelectorText(selectorText, context.scope));
      return `${stringifyScopedSelectorText(selectorText, context.scope)} { ${stringifyStyle(style)} }`;
    }

    case SlimVMObjectType.FONT_FACE_RULE: {
      const {  style } = rule as SlimFontFace;
      return `@font-face { ${stringifyStyle(style)} }`;
    }
    case SlimVMObjectType.AT_RULE: {
      const { name, params, rules } = rule as SlimCSSAtRule;

      return /^(charset|import)$/.test(name) ? `@${name} "${params}";` : `@${name} ${params} { }`;
    }
  }
};

const stringifyStyle = (style) => {
  let buffer: string = ``;

  for (const {name, value} of style) {
    buffer += `${name}: ${value};`
  }

  return buffer;
}

const getScopeTagName = (tagName: string) => `__${tagName}_scope`
const getElementScopeTagName = ({tagName}: SlimElement) => getScopeTagName(tagName);

const getElementScopeTagNameHost = (element: SlimElement) => getElementScopeTagName(element) + "__host";

const stringifyScopedSelectorText = (selectorText: string, scope: string) => {
  return scope ? compileScopedCSS(selectorText, getScopeTagName(scope)) : selectorText;
};

const appendNativeChildNodes = ({ childNodes }: SlimParentNode, nativeParent: Element|DocumentFragment, document: Document, context: CreateNativeNodeContext) => {
  for (let i = 0, {length} = childNodes; i < length; i++) {
    const nativeChild = createNativeNode(childNodes[i], document, context);
    if (nativeChild) {
      nativeParent.appendChild(nativeChild);
    }
  }
};

const deleteNestedCSSRules = (rule: SlimCSSGroupingRule, map: NativeObjectMap) => {
  map = updateCSSOMMap(map, { [rule.id]: undefined });
  if (rule.rules) {
    for (let i = rule.rules.length; i--;) {
      map = deleteNestedCSSRules(rule.rules[i] as any, map);
    }
  }
  return map;
};

const deleteNestedChildNodes = (node: SlimBaseNode, map: NativeObjectMap) => {
  map = updateDOMMap(map, { [node.id]: undefined });
  if ((node as SlimElement).shadow) {
    map = deleteNestedChildNodes((node as SlimElement).shadow, map);
  }
  if ((node as SlimParentNode).childNodes) {
    const parent = node as SlimParentNode;
    for (let i = parent.childNodes.length; i--;) {
      map = deleteNestedChildNodes(parent.childNodes[i] as any, map);
    }
  }
  return map;
};

export const patchDOM2 = (mutation: Mutation<any[]>, root: SlimParentNode, mount: HTMLElement, map: NativeObjectMap): NativeObjectMap => {


  let slimTarget = getVMObjectFromPath(mutation.target, root);
  const ownerDocument = mount.ownerDocument;

  switch(mutation.type) {
    case SET_TEXT_NODE_VALUE: {
      const nativeTarget = map.dom[slimTarget.id];
      (nativeTarget as Text).nodeValue = (mutation as SetValueMutation<any>).newValue;
      break;
    }
    case REMOVE_CHILD_NODE: {
      const { index } = mutation as RemoveChildMutation<any, any>;
      const parent = slimTarget as SlimParentNode;
      const child = parent.childNodes[index];
      map = removeNativeChildNode(child, map);
      break;
    }

    case REMOVE_ATTRIBUTE:
    case INSERT_ATTRIBUTE:
    case SET_ATTRIBUTE: {
      const { name, newValue, index } = mutation as SetPropertyMutation<any>;
      const slimElement = slimTarget as SlimElement;
      const nativeTarget = map.dom[slimTarget.id] as HTMLElement;
      const host = getMutationHost(mutation, root);

      if (slimElement.tagName === "slot") {
        if (name === "name") {
          // TODO - get host
          // TODO - insert children
          const oldSlotChildren = getSlotChildren(slimElement, host);

          for (let i = oldSlotChildren.length; i--;) {
            const child = oldSlotChildren[i];
            map = removeNativeChildNode(child, map);
          }

          const newSlotChildren = getSlotChildrenByName(newValue, host);

          const nativeParent = nativeTarget.parentNode;
        
          const slotIndex = Array.prototype.indexOf.call(nativeParent.childNodes, nativeTarget);

          let childMap: DOMMap = {};

          for (let i = 0, {length} = newSlotChildren; i < length; i++) {
            const child = newSlotChildren[i];
            const childHost = getNodeHost(child, root);
            const newNativeChild = createNativeNode(newSlotChildren[i], nativeTarget.ownerDocument, {
              root: root,
              map: childMap,
              host: childHost
            });

            insertNativeNode(newNativeChild, slotIndex + i + 1, nativeParent);
          }
          
          map = updateDOMMap(map, childMap);
        }

      } else {
        slimTarget = mutation.type === SET_ATTRIBUTE ? setElementAttributeAt(slimTarget as SlimElement, index, name, newValue) : mutation.type === REMOVE_ATTRIBUTE ? removeElementAttributeAt(slimTarget as SlimElement, index) : mutation.type === INSERT_ATTRIBUTE ? insertElementAttributeAt(slimTarget as SlimElement, index, name, newValue) : slimTarget;

        let actualValue = getAttributeValue(name, slimTarget as SlimElement);
        
        if (name === "class") {
          actualValue = actualValue + " " + getElementScopeTagName(host);
        }
        
        if (!actualValue) {
          nativeTarget.removeAttribute(name);
          delete nativeTarget.dataset[name.toLowerCase()];
        } else {
          setNativeElementAttribute(nativeTarget, name, actualValue);
        }
      }
      break;
    }
    case INSERT_CHILD_NODE: {
      const { child, index } = mutation as InsertChildMutation<any, any>;
      let insertIndex = index;

      let nativeOwner: Node;

      if ((slimTarget as SlimElement).shadow) {
        const slot = getSlot(getNodeSlotName(child), slimTarget as SlimElement);
        const nativeSlotMarker = map.dom[slot.id];
        const nativeSlotParent = nativeSlotMarker.parentNode;
        const nativeSlotIndex  = Array.prototype.indexOf.call(nativeSlotParent.childNodes, nativeSlotMarker);
        nativeOwner = nativeSlotParent;

        // TODO - index needs to be calculated based on other children that share the same slot.
        insertIndex = nativeSlotIndex + index + 1;
      } else {
        nativeOwner = map.dom[slimTarget.id];
        const beforeChild = (slimTarget as SlimParentNode).childNodes[insertIndex];

        if (beforeChild) {
          insertIndex = Array.prototype.indexOf.call(nativeOwner.childNodes, map.dom[beforeChild.id]);
        } else {
          insertIndex = nativeOwner.childNodes.length;
        }
      }

      let domMap: DOMMap = {};
      let cssomMap: CSSOMMap = {};
      const mutationHost = getMutationHost(mutation, root) as SlimElement;
      
      if (child.type === SlimVMObjectType.ELEMENT && (child as SlimElement).tagName === "style") {
        // console.log("INSERT LES CHILD", child);
        insertStyleSheet(child as SlimStyleElement, mount, {
          host: getNodeHost(child, root),
          map: { cssom: cssomMap, dom: domMap }
        }, insertIndex);

      } else {
        const nativeChild = createNativeNode(child, ownerDocument, {  
          map: domMap,
          root: root,
          host: mutationHost
        });

        if ((slimTarget as SlimElement).tagName === "slot") {
          const host = getMutationHost(mutation, root);
          const slot = slimTarget as SlimElement;
          const slotChildren = getSlotChildren(slot, host);
          const nativeParent = nativeOwner.parentNode;
          if (slotChildren.length === 0) {
            const beforeChild = index < slot.childNodes.length ? slot.childNodes[index] : null;
            const beforeNativeChild = beforeChild ? map.dom[beforeChild.id] : getSectionEndComment(nativeOwner as Comment);
            const nativeSlotIndex  = Array.prototype.indexOf.call(nativeParent.childNodes, beforeNativeChild);
            insertNativeNode(nativeChild, nativeSlotIndex, nativeParent);
          } else {
          }
        } else {
          insertNativeNode(nativeChild, insertIndex, nativeOwner);
        }

      }

      map = updateNativeMap(map, {
        cssom: cssomMap,
        dom: domMap
      });
      break;
    }
    case MOVE_CHILD_NODE: {
      const { index, oldIndex } = mutation as MoveChildMutation<any, any>;
      let insertIndex = index;
      const parent = slimTarget as SlimParentNode;
      const slimChild = parent.childNodes[oldIndex];
      const beforeChild = parent.childNodes[index];
      let nativeChild = map.dom[slimChild.id];
      const nativeParent = nativeChild.parentNode;

      // style sheets cannot be moved (for now) since they will not render if they're removed and re-added to the document. 
      if ((slimChild as SlimElement).tagName === "style") {
        break;
      }
      
      if ((slimChild as SlimElement).tagName === "slot") {
        const start = nativeChild as Comment;
        const children = getSectionChildNodes(start);
        const end = getSectionEndComment(start);

        nativeChild = nativeChild.ownerDocument.createDocumentFragment();
        nativeChild.appendChild(start);
        for (const child of children) {
          nativeChild.appendChild(child);
        }
        nativeChild.appendChild(end);
      }

      if (beforeChild) {
        insertIndex = Array.prototype.indexOf.call(nativeParent.childNodes, map.dom[beforeChild.id]);
      } else {
        insertIndex = nativeParent.childNodes.length;
      }

      insertNativeNode(nativeChild, insertIndex, nativeParent);
      break;
    }

    case CSS_SET_SELECTOR_TEXT: {
      const { newValue } = mutation as SetValueMutation<any>;
      const nativeTarget: CSSStyleRule = map.cssom[slimTarget.id] as CSSStyleRule;

      const host = getStyleElementFomPath(mutation.target
      , root);
      
      nativeTarget.selectorText = stringifyScopedSelectorText(newValue, getAttributeValue("scope", host));
      break;
    }
    

    case CSS_DELETE_RULE: {
      const { index } = mutation as RemoveChildMutation<any, any>;
      const grouping = map.cssom[slimTarget.id];
      const slimChild = (slimTarget as SlimCSSGroupingRule).rules[index];
      const nativeChild = map.cssom[slimChild.id];
      const parentRule: CSSGroupingRule = ((nativeChild as CSSStyleRule).parentRule || (nativeChild as CSSGroupingRule).parentStyleSheet) as any;

      parentRule.deleteRule(Array.prototype.indexOf.call(parentRule.cssRules, nativeChild));
      map = updateNativeMap(map, deleteNestedCSSRules(slimChild as any, map))
      break;
    }

    case CSS_DELETE_STYLE_PROPERTY:
    case CSS_INSERT_STYLE_PROPERTY:
    case CSS_SET_STYLE_PROPERTY: {
      const { type, name, newValue, index } = mutation as SetPropertyMutation<any>;
      const nativeTarget = map.cssom[slimTarget.id] as CSSStyleRule;

      slimTarget = type === CSS_INSERT_STYLE_PROPERTY ? insertCSSStyleProperty(slimTarget as SlimCSSStyleRule, index, name, newValue) : type === CSS_DELETE_STYLE_PROPERTY ? removeCSSStyleProperty(slimTarget as SlimCSSStyleRule, index) :setCSSStyleProperty(slimTarget as SlimCSSStyleRule, index, name, newValue);

      const actualValue = getStyleValue(name, (slimTarget as SlimCSSStyleRule).style);

      if (actualValue == null) {
        nativeTarget.style.removeProperty(name);
      } else {
        nativeTarget.style.setProperty(name, actualValue);
      }
      break;
    }

    case CSS_AT_RULE_SET_PARAMS: {
      const { newValue } = mutation as SetValueMutation<any>;
      const nativeTarget: CSSRule = map.cssom[slimTarget.id] as CSSMediaRule;
      if (nativeTarget.type === 4) {
        const mediaRule = nativeTarget as CSSMediaRule;
        mediaRule.conditionText = newValue;
      } else if (nativeTarget.type === 7) {
        const keyframesRule = nativeTarget as CSSKeyframesRule;
        keyframesRule.name = newValue;
      }
      break;
    }

    case REMOVE_SHADOW:
    case ATTACH_SHADOW: {

      // dumb patch where the target element is replaced entirely -- this is to reduce complex code, and is probably okay for this case since ATTACH_SHADOW probably won't be called that often.
      const patchedRoot = patchNode2(mutation, root);
      const patchedTarget = getVMObjectFromPath(mutation.target, patchedRoot);
      const nativeTarget = map.dom[slimTarget.id];
      const nativeParent = nativeTarget.parentNode;
      const index = Array.prototype.indexOf.call(nativeParent.childNodes, nativeTarget);
      nativeParent.removeChild(nativeTarget);
      map = deleteNestedChildNodes(slimTarget, map);

      const domMap = {};

      const newNativeTarget = createNativeNode(patchedTarget, document, {
        root: patchedRoot,
        host: getNodeHost(patchedTarget, patchedRoot),
        map: domMap
      });

      insertNativeNode(newNativeTarget, index, nativeParent);
      map = updateDOMMap(map, domMap);
      break;
    }

    case CSS_MOVE_RULE: {
      const { index, oldIndex } = mutation as MoveChildMutation<any, any>;
      const nativeTarget = map.cssom[slimTarget.id] as any;
      
      const cssomMap = {};

      const styleElement = getStyleElementFomPath(mutation.target, root);
      const scope = getAttributeValue("scope", styleElement);

      if ((nativeTarget as any as CSSKeyframesRule).appendRule) {
        const patchedRoot = patchNode2(mutation, root);
        const patchedSlimParent = getVMObjectFromPath(mutation.target, patchedRoot) as SlimCSSGroupingRule;
        while(nativeTarget.cssRules.length) {
          nativeTarget.deleteRule(0);
        }

        insertChildRules(patchedSlimParent, nativeTarget, {
          map: { cssom: cssomMap, dom: { }},
          scope,
        });
      } else {
        nativeTarget.deleteRule(oldIndex);
        insertChildRule((slimTarget as SlimCSSGroupingRule).rules[oldIndex], nativeTarget, {
          map: { cssom: cssomMap, dom: {}},
          scope
        }, index);
      }

      map = updateCSSOMMap(map, cssomMap);
      break;
    }

    case CSS_INSERT_RULE: { 
      const { index, child } = mutation as RemoveChildMutation<any, any>;
      const cssomMap = {};
      const styleElement = getStyleElementFomPath(mutation.target, root);
      insertChildRule(child, map.cssom[slimTarget.id] as any, {
        map: { cssom: cssomMap, dom: {}},
        scope: getAttributeValue("scope", styleElement)
      }, index);
      map = updateCSSOMMap(map, cssomMap);
      break;
    }
  }

  return map;
};

const updateDOMMap = (map: NativeObjectMap, dom: DOMMap): NativeObjectMap => ({
  ...map,
  dom: {
    ...map.dom,
    ...dom
  }
});

const setNativeElementAttribute = (nativeElement: HTMLElement, name: string, value: any) => {
  if (name === "style" && typeof value === "object") {
    Object.assign(nativeElement[name], value);
  } else if (typeof value !== "object") {
    nativeElement.setAttribute(name, value);
  }
  nativeElement.dataset[name.toLowerCase()] = "true";
}

const updateNativeMap = (oldMap: NativeObjectMap, newMap: NativeObjectMap): NativeObjectMap => ({
  ...oldMap,
  dom: {
    ...oldMap.dom,
    ...newMap.dom
  },
  cssom: {
    ...oldMap.cssom,
    ...newMap.cssom
  }
});

const getSectionChildNodes = (start: Comment) => {
  const children: Node[] = [];
  let current = start.nextSibling;
  const end = getSectionEndComment(start);
  while(current !== end) {
    children.push(current);
    current = current.nextSibling;
  }
  return children;
};

const getLastSectionChildNode = (start: Comment) => {
  const sectionChildNodes = getSectionChildNodes(start);
  return sectionChildNodes[sectionChildNodes.length - 1];
};
const getSectionEndComment = (start: Comment) => {
  let current = start.nextSibling;
  while((current as Comment).text !== "section-end") {
    if (current.nodeType === 8 && (current as Comment).text === "section-start") {
      current = getSectionEndComment(current as Comment);
    }
    current = current.nextSibling;
  }
  return current;
};


const updateCSSOMMap = (oldMap: NativeObjectMap, newMap: CSSOMMap): NativeObjectMap => ({
  ...oldMap,
  cssom: {
    ...oldMap.cssom,
    ...newMap
  }
});

const removeNativeChildNode = (child: SlimBaseNode, map: NativeObjectMap, updateMap: boolean = true) => {
  const nativeChild = map.dom[child.id];

  // happens for style elements
  if (!nativeChild) {
    throw new Error(`VM node does not have an associative DOM element`);
  }


  if ((child as SlimElement).tagName === "slot") {
    const slot = child as SlimElement;
    for (let i = slot.childNodes.length; i--;) {
      removeNativeChildNode(slot.childNodes[i], map, false);
    }
    const end = getSectionEndComment(nativeChild as Comment);
    end.parentNode.removeChild(end);
  }

  nativeChild.parentNode.removeChild(nativeChild);

  if (updateMap) {
    map = deleteNestedChildNodes(child, map);
  }


  return map;
};

const insertNativeNode = (child: Node, index: number, parent: Node) => {  
  if (index >= parent.childNodes.length) {
    parent.appendChild(child);
  } else {
    parent.insertBefore(child, parent.childNodes[index]);
  }
};

const getMutationHost = (mutation: Mutation<any[]>, root: SlimParentNode) => getHostFromPath(mutation.target, root);

const getNodeHost = (child: SlimBaseNode, root: SlimParentNode) => getHostFromPath(getVMObjectPath(child, root), root);

const getHostFromPath = weakMemo((path: string[], root: SlimParentNode) => {
  const index = path.lastIndexOf("shadow");
  if (index === -1) {
    return null;
  }
  return getVMObjectFromPath(path.slice(0, index), root) as SlimElement;
});

const getStyleElementFomPath = weakMemo((path: string[], root: SlimParentNode) => {
  const index = path.lastIndexOf("sheet");
  if (index === -1) {
    return null;
  }
  return getVMObjectFromPath(path.slice(0, index), root) as SlimElement;
});

// do NOT memoize this since computed information may change over time. 
export const computedDOMInfo2 = (map: NativeObjectMap): ComputedDOMInfo => {
  let computedInfo = {};
  for (const nodeId in map.dom) {
    const node = map.dom[nodeId];

    if (!node || getVMObjectIdType(nodeId) !== SlimVMObjectType.ELEMENT) {
      continue;
    }

    if (node.nodeName.charAt(0) === "#") {
      continue;
    }
    
    const element = node as HTMLElement;

    if (!element.ownerDocument.defaultView) {
      console.warn(`Element is not attached to the document body.`);
      return {};
    }

    // TODO - memoize computed info here
    computedInfo[nodeId] = {
      bounds: element.getBoundingClientRect(),
      style: element.ownerDocument.defaultView.getComputedStyle(element)
    };
  }
  return computedInfo;
};