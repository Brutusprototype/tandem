import { 
  weakMemo, 
} from "aerial-common2";


import { Mutation, Mutator, SetValueMutation, SetPropertyMutation, createPropertyMutation, createSetValueMutation, eachArrayValueMutation, diffArray, RemoveChildMutation, createStringMutation, createRemoveChildMutation, createInsertChildMutation, createMoveChildMutation, InsertChildMutation, MoveChildMutation } from "source-mutation";
import { CSS_PARENT_DELETE_RULE, CSS_PARENT_INSERT_RULE, CSS_PARENT_MOVE_RULE, CSS_STYLE_RULE_SET_SELECTOR_TEXT, CSS_STYLE_RULE_SET_STYLE, CSS_STYLE_RULE_SET_STYLE_PROPERTY } from "./constants";

import { 
  SyntheticCSSRule, 
  SyntheticCSSStyleRule, 
  SyntheticCSSGroupingRule,
  SyntheticCSSMediaRule,
  SyntheticCSSKeyframeRule,
  SyntheticCSSFontFaceRule,
  SYNTHETIC_CSS_STYLE_RULE,
  SYNTHETIC_CSS_MEDIA_RULE,
  SYNTHETIC_CSS_FONT_FACE_RULE,
  SYNTHETIC_CSS_KEYFRAME_RULE,
  SYNTHETIC_CSS_KEYFRAMES_RULE,
  SyntheticCSSKeyframesRule,
  createSyntheticCSSStyleRule, 
  createSyntheticCSSMediaRule,
  createSyntheticCSSFontFaceRule,
  createSyntheticCSSKeyframeRule,
  createSyntheticCSSKeyframesRule,
  createSyntheticCSSUnknownGroupingRule,
} from "../../state";

import { diffCSStyleDeclaration, SEnvCSSStyleDeclarationInterface, cssStyleDeclarationMutators, parseStyleSource } from "./declaration";
import { SEnvCSSObjectInterface, getSEnvCSSBaseObjectClass, SEnvCSSObjectParentInterface } from "./base";
import { SEnvCSSStyleSheetInterface } from "./style-sheet";
import { getSEnvCSSCollectionClasses } from "./collections";
import { CSSRuleType } from "../constants";
import { evaluateCSS } from "./utils";

export interface SEnvCSSRuleInterface extends CSSRule, SEnvCSSObjectInterface {
  struct: SyntheticCSSRule;
  didChange(mutation: Mutation<any>, notifyOwnerNode?: boolean);
  $parentRule: SEnvCSSRuleInterface;
  $parentStyleSheet: SEnvCSSStyleSheetInterface;
}

export interface SEnvCSSParentRuleInterface extends SEnvCSSRuleInterface, SEnvCSSObjectParentInterface {
  struct: SyntheticCSSRule;
}

export interface SEnvCSSStyleRuleInterface extends CSSStyleRule, SEnvCSSParentRuleInterface {
  struct: SyntheticCSSStyleRule;
  style: SEnvCSSStyleDeclarationInterface;
}

export interface CSSParentObject {
  cssRules: CSSRuleList;
  deleteRule(index: number): void;
  insertRule(rule: string|CSSRule, index: number): number;
}

export const cssInsertRule = (parent: CSSStyleSheet|CSSGroupingRule, child: string|CSSRule, index: number, context: any) => {
  const isStyleRule = parent.type != null;
  const styleSheet = isStyleRule ? (parent as CSSGroupingRule).parentStyleSheet : parent as CSSStyleSheet;
  if (!child) {
    return -1;
  }
  if (typeof child === "string") {
    const childObject = evaluateCSS(child, styleSheet.href, context, null).cssRules[0];
    if (isStyleRule) {
      childObject.$parentRule = parent;
    } else {
      childObject.$parentStyleSheet = parent;
    }
    child = childObject;
  }
  if (index == null) {
    index = parent.cssRules.length;
  }
  
  Array.prototype.splice.call(parent.cssRules, index, 0, child);
  parent["didChange"](cssParentInsertRule(parent, child as CSSRule, index));
  return index;
}


export const cssDeleteRule = (parent: CSSStyleSheet|CSSGroupingRule, index: number) => {
  const child = parent.cssRules[index];
  Array.prototype.splice.call(parent.cssRules, index, 1);
  parent["didChange"](cssParentDeleteRule(parent, child, index));
}

export const getSEnvCSSRuleClasses = weakMemo((context: any) => {
  const { SEnvCSSRuleList } =  getSEnvCSSCollectionClasses(context);
  const SEnvBaseObjectClass = getSEnvCSSBaseObjectClass(context);

  abstract class SEnvCSSRule extends SEnvBaseObjectClass implements SEnvCSSRuleInterface {
    readonly CHARSET_RULE: number;
    readonly FONT_FACE_RULE: number;
    readonly IMPORT_RULE: number;
    readonly KEYFRAME_RULE: number;
    readonly KEYFRAMES_RULE: number;
    readonly MEDIA_RULE: number;
    readonly NAMESPACE_RULE: number;
    readonly PAGE_RULE: number;
    readonly STYLE_RULE: number;
    readonly SUPPORTS_RULE: number;
    readonly UNKNOWN_RULE: number;
    readonly VIEWPORT_RULE: number;
    $source: any;
    struct: SyntheticCSSRule;

    get cssText() {
      return this.getCSSText();
    }

    set cssText(value: string) {
      this.setCSSText(value);
      this._struct = undefined;
      // TODO - notify parent rune
    }

    protected abstract setCSSText(value: string);
    protected abstract getCSSText();

    abstract readonly type: number;
    $parentRule: SEnvCSSParentRuleInterface;
    $parentStyleSheet: SEnvCSSStyleSheetInterface;

    get parentRule() {
      return this.$parentRule;
    }

    get parentStyleSheet() {
      return this.$parentStyleSheet || (this.$parentRule && this.$parentRule.parentStyleSheet) as SEnvCSSStyleSheetInterface;
    }

    public didChange(mutation: Mutation<any>, notifyOwnerNode?: boolean) {

      this._struct = undefined;

      if (this.parentRule) {
        this.parentRule.didChange(mutation, notifyOwnerNode);
      } else if (this.parentStyleSheet) {
        this.parentStyleSheet.didChange(mutation, notifyOwnerNode);
      }
    }
  }

  abstract class SEnvCSSStyleParentRule extends SEnvCSSRule implements SEnvCSSParentRuleInterface {
  }

  class SEnvCSSStyleRule extends SEnvCSSStyleParentRule implements SEnvCSSStyleRuleInterface {
    readonly readOnly: boolean;
    struct: SyntheticCSSStyleRule;
    private _selectorText: string;
    get selectorText() {
      return this._selectorText;
    }
    set selectorText(value: string) {
      this._selectorText = value;
      this.didChange(cssStyleRuleSetSelectorText(this, value), true);
    }
    readonly style: SEnvCSSStyleDeclarationInterface;
    readonly type = CSSRuleType.STYLE_RULE;
    constructor(selectorText: string, style: SEnvCSSStyleDeclarationInterface) {
      super();
      this.selectorText = selectorText;
      this.style = style;
      style.parentRule = this;
    }
    $createStruct() {
      return createSyntheticCSSStyleRule({
        $id: this.$id,
        source: this.source,
        instance: this,
        selectorText: this.selectorText,
        style: this.style.struct
      });
    }

    getCSSText() {
      return `${this.selectorText} { ${this.style.cssText} }`;
    }
    get previewCSSText() {
      return `${this.selectorText} { ${this.style.previewCSSText} }`;
    }

    protected setCSSText(value: string) {
      // NOTHING FOR NOW
    }

    cloneDeep() {
      return new SEnvCSSStyleRule(
        this.selectorText,
        this.style.clone()
      );
    }
  }
  
  abstract class SEnvCSSGroupingRule extends SEnvCSSStyleParentRule implements CSSGroupingRule {
    readonly cssRules: CSSRuleList;
    constructor(rules: SEnvCSSRule[] = []) {
      super();
      this.cssRules = new SEnvCSSRuleList(...rules);
      for (let i = rules.length; i--;) {
        rules[i].$parentRule = this;
      }
    }
    getCSSText() {
      return null;
    }
    protected setCSSText(value: string) {

    }
    deleteRule(index: number): void {
      return cssDeleteRule(this, index);
    }
    insertRule(rule: string, index: number): number {
      return cssInsertRule(this, rule, index, context);
    }
  }

  class SEnvMediaList implements MediaList {
    readonly length = 0;
    [identifier: number]: string;
    constructor(public mediaText: string) {
      
    }
    item(index: number) {
      // throw new Error(`not implemented`);
      return null;
    }
    appendMedium(value: string) {
      throw new Error(`not implemented`);
    }
    deleteMedium(value: string) {
      throw new Error(`not implemented`);
    }
  }

  class SEnvCSSMediaRule extends SEnvCSSGroupingRule implements CSSMediaRule {
    readonly type = CSSRuleType.MEDIA_RULE;
    readonly media: MediaList;
    constructor(private _conditionText: string, rules: SEnvCSSRule[]) {
      super(rules);
      this.media = new SEnvMediaList(this._conditionText);
    }

    get previewCSSText() {
      return `@media ${this.conditionText} { ${Array.prototype.map.call(this.cssRules, rule => rule.previewCSSText).join(" ")} }`;
    }

    getCSSText() {
      return `@media ${this.conditionText} { ${Array.prototype.map.call(this.cssRules, rule => rule.cssText).join(" ")} }`;
    }

    $createStruct() {
      return createSyntheticCSSMediaRule({
        $id: this.$id,
        instance: this,
        source: this.source,
        conditionText: this.conditionText,
        rules: Array.prototype.map.call(this.cssRules, rule => rule.struct)
      });
    }

    get conditionText() {
      return this._conditionText;
    }

    set conditionText(value: string) {
      this._conditionText = value;
      this.didChange(mediaRuleSetConditionText(this, value));
    }

    cloneDeep() {
      return new SEnvCSSMediaRule(
        this.conditionText,
        Array.prototype.map.call(this.cssRules, rule => rule.clone())
      );
    }
  }

  class SEnvCSSFontFace extends SEnvCSSRule implements CSSFontFaceRule {
    readonly type = CSSRuleType.FONT_FACE_RULE;
    public style: SEnvCSSStyleDeclarationInterface;
    constructor(style: SEnvCSSStyleDeclarationInterface) {
      super();
      this.style = style;
      style.parentRule = this;
      style.$owner = this;
    }
    get previewCSSText() {
      return `@font-face { ${this.style.previewCSSText} }`;
    }
    getCSSText() {
      return `@font-face { ${this.style.cssText} }`
    }
    $createStruct() {
      return createSyntheticCSSFontFaceRule({
        $id: this.$id,
        instance: this,
        source: this.source,
        style: this.style.struct,
      });
    }
    protected setCSSText(value: string) {   

    }
    cloneDeep() {
      return new SEnvCSSFontFace(
        this.style.clone()
      );
    }
  }

  class SEnvCSSKeyframeRule extends SEnvCSSRule implements CSSKeyframeRule {
    readonly type = CSSRuleType.KEYFRAME_RULE;
    public style: SEnvCSSStyleDeclarationInterface;

    constructor(private _keyText: string, style: SEnvCSSStyleDeclarationInterface) {
      super();
      this.style = style;
    }

    get keyText() {
      return this._keyText;
    }

    set keyText(value: string) {
      this._keyText = value;
      // this.didChange();
    }

    $createStruct() {
      return createSyntheticCSSKeyframeRule({
        $id: this.$id,
        instance: this,
        source: this.source
      });
    }

    get previewCSSText() {
      return `${this.keyText} { ${this.style.previewCSSText} }`;
    }

    getCSSText() {
      return `${this.keyText} { ${this.style.cssText} }`;
    }
    
    setCSSText(value: string) {
      throw new Error(`Not implemented`);
    }
    cloneDeep() {
      return new SEnvCSSKeyframeRule(
        this._keyText,
        this.style.clone()
      );
    }
  }

  class SEnvCSSKeyframesRule extends SEnvCSSRule implements CSSKeyframesRule {
    readonly type = CSSRuleType.FONT_FACE_RULE;
    readonly cssRules: CSSRuleList;
    constructor(readonly name: string, rules: CSSRule[] = []) {
      super();
      this.cssRules = new SEnvCSSRuleList(...rules);
    }

    $createStruct() {
      return createSyntheticCSSKeyframesRule({
        $id: this.$id,
        instance: this,
        source: this.source,
        rules: Array.prototype.map.call(this.cssRules, rule => rule.struct)
      });
    }

    get previewCSSText() {
      return `@keyframes ${this.name} { }`;
    }

    protected getCSSText() {
      return `@keyframes ${this.name} { ${Array.prototype.map.call(this.cssRules, rule => rule.cssText).join(" ")} }`;
    }

    protected setCSSText(value: string) {

    }

    appendRule(rule: string) {

    }
    deleteRule(rule: string) {

    }
    findRule(rule: string) {
      return null;
    }
    cloneDeep() {
      return new SEnvCSSKeyframesRule(
        this.name,
        Array.prototype.map.call(this.cssRules, rule => rule.clone())
      );
    }
  }

  class SEnvUnknownGroupingRule extends SEnvCSSGroupingRule {
    readonly type = CSSRuleType.UNKNOWN_RULE;
    getCSSText() {
      return ``;
    }
    get previewCSSText() {
      return ``;
    }
    $createStruct() {
      return createSyntheticCSSUnknownGroupingRule({
        $id: this.$id,
        instance: this,
        source: this.source,
        rules: []
      })
    }
    protected setCSSText(value: string) {

    }
    cloneDeep() {
      return new SEnvUnknownGroupingRule();
    }
  }

  return {
    SEnvCSSStyleRule,
    SEnvCSSMediaRule,
    SEnvCSSKeyframesRule,
    SEnvCSSFontFace,
    SEnvUnknownGroupingRule
  };
});

export const cssStyleRuleSetSelectorText = (rule: CSSStyleRule, selectorText: string) => createSetValueMutation(CSS_STYLE_RULE_SET_SELECTOR_TEXT, rule, selectorText);
export const cssStyleRuleSetStyle = (rule: CSSStyleRule, style: SEnvCSSStyleDeclarationInterface) => createSetValueMutation(CSS_STYLE_RULE_SET_STYLE, rule, style.cssText);
export const cssStyleRuleSetStyleProperty = (rule: CSSStyleRule, name: string, value: string) => createPropertyMutation(CSS_STYLE_RULE_SET_STYLE_PROPERTY, rule, name, value);

const diffStyleRule = (oldRule: CSSStyleRule, newRule: CSSStyleRule) => {
  const mutations = [];

  if (oldRule.selectorText !== newRule.selectorText) {
    mutations.push(cssStyleRuleSetSelectorText(oldRule, newRule.selectorText));
  }

  mutations.push(...diffCSStyleDeclaration(oldRule.style, newRule.style));

  return mutations;
};

export const cssParentInsertRule = (parent: CSSParentObject, rule: CSSRule, newIndex: number) => createInsertChildMutation(CSS_PARENT_INSERT_RULE, parent, rule, newIndex);

export const cssParentDeleteRule = (parent: CSSParentObject, rule: CSSRule, index?: number) => createRemoveChildMutation(CSS_PARENT_DELETE_RULE, parent, rule, index);

export const cssParentMoveRule = (parent: CSSParentObject, rule: CSSRule, newIndex: number, oldIndex: number) => createMoveChildMutation(CSS_PARENT_MOVE_RULE, parent, rule, newIndex, oldIndex);

export const diffCSSParentObject = (oldParent: CSSParentObject, newParent: CSSParentObject) => {
  const mutations = [];

  const oldSheetRules = Array.prototype.slice.call(oldParent.cssRules) as CSSRule[];
  const diffs = diffArray(oldSheetRules, Array.prototype.slice.call(newParent.cssRules) as CSSRule[], compareCSSRule);

  eachArrayValueMutation(diffs, {
    insert({ value, index }) {
      mutations.push(cssParentInsertRule(oldParent, value, index));
    },
    delete({ value, index }) {
      mutations.push(cssParentDeleteRule(oldParent, value, index));
    },
    update({ newValue, patchedOldIndex, index, originalOldIndex }) {
      if (patchedOldIndex !== index) { 
        mutations.push(cssParentMoveRule(oldParent, newValue, index, patchedOldIndex));
      }
      mutations.push(...diffCSSRule(oldSheetRules[originalOldIndex], newValue));
    }
  });

  return mutations;
};


export const CSS_MEDIA_RULE_SET_CONDITION_TEXT = "CSS_MEDIA_RULE_SET_CONDITION_TEXT"; 

const mediaRuleSetConditionText = (rule: CSSMediaRule, conditionText: string) => createSetValueMutation(CSS_MEDIA_RULE_SET_CONDITION_TEXT, rule, conditionText);


const diffMediaRule = (oldRule: CSSMediaRule, newRule: CSSMediaRule) => {
  const mutations = [];
  if (oldRule.conditionText !== newRule.conditionText) {
    mutations.push(mediaRuleSetConditionText(oldRule, newRule.conditionText))
  }
  mutations.push(...diffCSSParentObject(oldRule, newRule));
  return mutations;
}

export const diffCSSRule = (oldRule: CSSRule, newRule: CSSRule) => {
  if (oldRule.type === CSSRuleType.STYLE_RULE) {
    return diffStyleRule(oldRule as CSSStyleRule, newRule as CSSStyleRule);
  } else if (oldRule.type === CSSRuleType.MEDIA_RULE) {
    return diffMediaRule(oldRule as CSSMediaRule, newRule as CSSMediaRule);
  }
  return [];
};

export const cssStyleRuleMutators = {
  ...cssStyleDeclarationMutators,
  [CSS_STYLE_RULE_SET_SELECTOR_TEXT]: (target: CSSStyleRule, mutation: SetValueMutation<any>) => {
    target.selectorText = mutation.newValue;
  },
  [CSS_STYLE_RULE_SET_STYLE]: (target: CSSStyleRule, { newValue: style }: SetValueMutation<string>) => {
    while(target.style.length) {
      target.style.removeProperty(target.style[0]);
    }
    
    const props = parseStyleSource(style);

    for (const prop in props) {
      target.style.setProperty(prop, props[prop]);
    }
  },
  [CSS_STYLE_RULE_SET_STYLE_PROPERTY]: (target: CSSStyleRule, { name, newValue }: SetPropertyMutation<any>) => {
    target.style.setProperty(name, newValue);
  }
}

export const cssMediaRuleMutators = {
  [CSS_MEDIA_RULE_SET_CONDITION_TEXT](target: CSSMediaRule, mutation: SetValueMutation<any>) {
    target.conditionText = mutation.newValue;
  }
}

export const cssRuleMutators = {
  ...cssStyleRuleMutators,
  ...cssMediaRuleMutators
};

export const cssParentMutators = {
  ...cssRuleMutators,
  [CSS_PARENT_INSERT_RULE](target: CSSParentObject, mutation: InsertChildMutation<any, CSSRule>) {
    target.insertRule(mutation.child.cssText, mutation.index);
  },
  [CSS_PARENT_MOVE_RULE](target: CSSParentObject, mutation: MoveChildMutation<any, CSSRule>) {
    const child = target.cssRules[mutation.oldIndex];
    target.deleteRule(mutation.oldIndex);
    target.insertRule(child, mutation.index);
  },
  [CSS_PARENT_DELETE_RULE](target: CSSParentObject, mutation: RemoveChildMutation<any, CSSRule>) {
    target.deleteRule(mutation.index);
  }
};

export const flattenCSSRuleSources = weakMemo((rule: SyntheticCSSRule) => {
  const flattened: any = { [rule.$id]: rule.instance };
  if (rule.$type === SYNTHETIC_CSS_STYLE_RULE) {
    const styleRule = rule as SyntheticCSSStyleRule;
    flattened[styleRule.style.$id] = styleRule.style.instance;
  } else if (rule.$type === SYNTHETIC_CSS_FONT_FACE_RULE) {
    const styleRule = rule as SyntheticCSSFontFaceRule;
    flattened[styleRule.style.$id] = styleRule.style.instance;
  } else if (rule["rules"]) {
    const groupingRule = rule as SyntheticCSSGroupingRule;
    for (let i = groupingRule.rules.length; i--;) {
      Object.assign(flattened, flattenCSSRuleSources(groupingRule.rules[i]));
    }
  } else {
    throw new Error(`Cannot flatten ${rule.$type}`);
  }
  return flattened;
});

export const compareCSSRule = (a: CSSRule, b: CSSRule) => {
  if (a.type !== b.type) {
    return -1;
  }

  if (a.cssText === b.cssText) {
    return 0;
  }

  if (a.type === CSSRuleType.STYLE_RULE) {
    const a2 = a as CSSStyleRule;
    const b2 = b as CSSStyleRule;

    if (a2.selectorText === b2.selectorText) {
      return 0;
    }

    return 1;
  } else if (a.type === CSSRuleType.MEDIA_RULE) {
    
  } else if (a.type === CSSRuleType.FONT_FACE_RULE) {

  } else if (a.type === CSSRuleType.KEYFRAMES_RULE) {
    
  } else if (a.type === CSSRuleType.KEYFRAME_RULE) {

  } else if (a.type === CSSRuleType.UNKNOWN_RULE) {

  }

  return 1;
}