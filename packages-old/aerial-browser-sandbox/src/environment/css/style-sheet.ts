import { parseCSS, evaluateCSS } from "./utils";
import { SyntheticCSSStyleSheet, createSyntheticCSSStyleSheet, SYNTHETIC_CSS_STYLE_SHEET } from "../../state";
import { CSSRuleType } from "../constants";
import { SEnvCSSRuleInterface, compareCSSRule, diffCSSRule, flattenCSSRuleSources, cssRuleMutators, diffCSSParentObject, cssParentMutators, cssInsertRule, cssDeleteRule } from "./rules";
import { 
  weakMemo, 
} from "aerial-common2";

import { Mutation, Mutator, SetValueMutation, SetPropertyMutation, createPropertyMutation, createSetValueMutation, eachArrayValueMutation, diffArray, RemoveChildMutation, createStringMutation, createInsertChildMutation, createMoveChildMutation, InsertChildMutation, MoveChildMutation, createRemoveChildMutation } from "source-mutation";
import {  getSEnvCSSCollectionClasses } from "./collections";
import { SEnvCSSObjectInterface, getSEnvCSSBaseObjectClass } from "./base";
import { SEnvNodeInterface } from "../";

export interface SEnvCSSStyleSheetInterface extends CSSStyleSheet, SEnvCSSObjectInterface {
  $id: string;
  href: string;
  struct: SyntheticCSSStyleSheet;
  ownerNode: Node;
  didChange(mutation: Mutation<any>, notifyOwnerNode?: boolean);
  clone(): SEnvCSSStyleSheetInterface;
}

export const getSEnvCSSStyleSheetClass = weakMemo((context: any) => {
  const { SEnvCSSRuleList } =  getSEnvCSSCollectionClasses(context);
  const SEnvCSSBaseObject = getSEnvCSSBaseObjectClass(context);
  return class SEnvCSSStyleSheet extends SEnvCSSBaseObject implements SEnvCSSStyleSheetInterface {
    disabled: boolean;
    private _rules: CSSRuleList;
    href: string;
    readonly media: MediaList;
    readonly ownerNode: SEnvNodeInterface;
    readonly parentStyleSheet: StyleSheet;
    readonly title: string;
    readonly type: string;
    readonly id: string;
    readonly imports: StyleSheetList;
    readonly isAlternate: boolean;
    readonly isPrefAlternate: boolean;
    readonly ownerRule: CSSRule;
    readonly owningElement: Element;
    readonly pages: StyleSheetPageList;
    readonly readOnly: boolean;
    struct: SyntheticCSSStyleSheet;

    constructor(rules: SEnvCSSRuleInterface[] = []) {
      super();
      this._reset(rules);
    }

    get cssText() {
      return Array.prototype.map.call(this.cssRules, rule => rule.cssText).join(" ");
    }

    get previewCSSText() {
      return Array.prototype.map.call(this.cssRules, rule => rule.previewCSSText).join(" ");
    }

    get rules(): CSSRuleList {
      return this._rules;
    }

    get cssRules(): CSSRuleList {
      return this._rules;
    }

    $createStruct(): SyntheticCSSStyleSheet {
      return createSyntheticCSSStyleSheet({ 
        $id: this.$id,
        instance: this,
        source: this.source,
        cssRules: Array.prototype.map.call(this.cssRules, ((rule: SEnvCSSObjectInterface) => rule.struct))
      });
    }

    set cssText(value: string) {
      const styleSheet = evaluateCSS(value, this.href, context, this.ownerNode && this.ownerNode.source && this.ownerNode.source.fingerprint);
      this.source = styleSheet.source;
      this._reset(styleSheet.cssRules);
    }

    private _reset(rules: SEnvCSSRuleInterface[] = []) {
      this._rules = new SEnvCSSRuleList(...rules);
      for (let i = rules.length; i--;) {
        rules[i].$parentStyleSheet = this;
      }
    }
    
    addImport(bstrURL: string, lIndex?: number): number {
      throw new Error(`not currently supported`);
    }
    addPageRule(bstrSelector: string, bstrStyle: string, lIndex?: number): number {
      throw new Error(`not currently supported`);
    }
    addRule(bstrSelector: string, bstrStyle?: string, lIndex?: number): number {
      throw new Error(`not currently supported`);
    }
    deleteRule(index?: number): void {
      return cssDeleteRule(this, index);
    }
    insertRule(rule: string|CSSRule, index?: number): number {
      return cssInsertRule(this, rule, index, context);
    }
    removeImport(lIndex: number): void {
      throw new Error(`not currently supported`);
    }
    removeRule(lIndex: number): void {
      return cssDeleteRule(this, lIndex);
    }
    didChange(mutation: Mutation<any>, notifyOwnerNode?: boolean) {
      this._struct = undefined;
      if (notifyOwnerNode !== false && this.ownerNode) {
        this.ownerNode.dispatchMutationEvent(mutation);
      }
    }
    clone(): SEnvCSSStyleSheetInterface {
      return super.clone() as SEnvCSSStyleSheetInterface;
    }
    cloneDeep() {
      const clone = new SEnvCSSStyleSheet(Array.prototype.map.call(this.rules, (rule => rule.clone())));
      clone.href = this.href;
      return clone;
    }
  }
});

export const STYLE_SHEET_INSERT_RULE = "STYLE_SHEET_INSERT_RULE";
export const STYLE_SHEET_DELETE_RULE = "STYLE_SHEET_DELETE_RULE";
export const STYLE_SHEET_MOVE_RULE   = "STYLE_SHEET_MOVE_RULE";

export const cssStyleSheetMutators = {
  ...cssParentMutators,
  // [STYLE_SHEET_INSERT_RULE]: ()
}

export const styleSheetInsertRule = (styleSheet: CSSStyleSheet, rule: CSSRule, newIndex: number) => createInsertChildMutation(STYLE_SHEET_MOVE_RULE, styleSheet, rule, newIndex);

export const styleSheetDeleteRule = (styleSheet: CSSStyleSheet, rule: CSSRule, newIndex: number, index?: number) => createRemoveChildMutation(STYLE_SHEET_MOVE_RULE, styleSheet, rule, index);

export const styleSheetMoveRule = (styleSheet: CSSStyleSheet, rule: CSSRule, newIndex: number, oldIndex: number) => createMoveChildMutation(STYLE_SHEET_MOVE_RULE, styleSheet, rule, newIndex, oldIndex);

export const diffCSSStyleSheet = (oldSheet: CSSStyleSheet, newSheet: CSSStyleSheet) => {
  return diffCSSParentObject(oldSheet, newSheet);
}

export const flattenSyntheticCSSStyleSheetSources = weakMemo((sheet: SyntheticCSSStyleSheet): { [identifier: string]: SEnvCSSObjectInterface } => {
  const flattened = { [sheet.$id]: sheet.instance };
  for (let i = 0, n = sheet.cssRules.length; i < n; i++) {
    Object.assign(flattened, flattenCSSRuleSources(sheet.cssRules[i]));
  }
  return flattened;
});

export const patchCSSStyleSheet = (target: SEnvCSSObjectInterface, mutation: Mutation<any>) => {
  const mutate = cssStyleSheetMutators[mutation.type] as any as (target: SEnvCSSObjectInterface, mutation: Mutation<any>) => any;

  if (!mutate) {
    throw new Error(`Cannot apply mutation ${mutation.type} on CSS object`);
  }
  return mutate(target, mutation);
}
