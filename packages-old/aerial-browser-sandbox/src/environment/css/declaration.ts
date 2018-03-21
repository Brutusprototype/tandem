import { weakMemo, generateDefaultId, Struct } from "aerial-common2";
import { Mutation, SetValueMutation, SetPropertyMutation, createPropertyMutation, createSetValueMutation, eachArrayValueMutation, diffArray } from "source-mutation";
import { kebabCase, camelCase, identity } from "lodash";
import { SEnvCSSObjectInterface } from "./base";
import { SEnvWindowContext } from "../window";
import { getUri } from "../utils";
import { SEnvCSSRuleInterface } from "./rules";
import { SEnvHTMLElementInterface } from "../../";
import { createSyntheticCSSStyleDeclaration, SyntheticCSSStyleDeclaration } from "../../state";

export const isValidCSSDeclarationProperty = (property: string) => !/^([\$_]|\d+$)/.test(property.charAt(0)) && !/^(uid|\$id|_struct|struct|parentRule|disabledProperties|_onChange|length)$/.test(property);

export interface SEnvCSSStyleDeclarationInterface extends CSSStyleDeclaration {
  parentRule: SEnvCSSRuleInterface;
  $id: string;
  $owner: SEnvHTMLElementInterface |  SEnvCSSRuleInterface;
  readonly struct: SyntheticCSSStyleDeclaration;
  previewCSSText: string;
  toggle(propertyName: string);
  setProperty(name: string, value: string, priority?: string, oldName?: string, notifyOwnerNode?: boolean);
  $updatePropertyIndices();
  clone(): SEnvCSSStyleDeclarationInterface;
}

const getJSPropName = (name: string) => {

  // if --, then it's a var, or vendor prefix
  return name.substr(0, 2) === "--" ? name : camelCase(name);
}

export const cssPropNameToKebabCase = (propName: string) => {
  propName = propName.substr(0, 2) === "--" ? propName : kebabCase(propName);

  // vendor prefix
  if (/^(webkit|moz|ms|o)-/.test(propName)) {
    propName = "-" + propName;
  }

  return propName;
}

const NO_STYLE_MATCH = [null, null, null];

export const parseStyleSource = (source: string) => {

  const props = {};
  
  source.split(";").forEach((decl) => {

    // use regexp here to ensure that : that are part of the declaration value stay in tact
    const [match, key, value] = decl.match(/(.+?):(.+)/) || NO_STYLE_MATCH;
    if (!key || !value.length) return;
    const ccKey = getJSPropName(key.trim());
    props[ccKey] = value.trim();
  });

  return props;
}
export const getSEnvCSSStyleDeclarationClass = weakMemo(({ getProxyUrl = identity }: SEnvWindowContext) => {
  return class SEnvCSSStyleDeclaration implements SEnvCSSStyleDeclarationInterface {

    $owner: SEnvHTMLElementInterface | SEnvCSSRuleInterface;
    alignContent: string | null;
    alignItems: string | null;
    alignmentBaseline: string | null;
    alignSelf: string | null;
    animation: string | null;
    animationDelay: string | null;
    animationDirection: string | null;
    animationDuration: string | null;
    animationFillMode: string | null;
    animationIterationCount: string | null;
    animationName: string | null;
    animationPlayState: string | null;
    animationTimingFunction: string | null;
    backfaceVisibility: string | null;
    background: string | null;
    backgroundAttachment: string | null;
    backgroundClip: string | null;
    backgroundColor: string | null;
    backgroundImage: string | null;
    backgroundOrigin: string | null;
    backgroundPosition: string | null;
    backgroundPositionX: string | null;
    backgroundPositionY: string | null;
    backgroundRepeat: string | null;
    backgroundSize: string | null;
    baselineShift: string | null;
    border: string | null;
    borderBottom: string | null;
    borderBottomColor: string | null;
    borderBottomLeftRadius: string | null;
    borderBottomRightRadius: string | null;
    borderBottomStyle: string | null;
    borderBottomWidth: string | null;
    borderCollapse: string | null;
    borderColor: string | null;
    borderImage: string | null;
    borderImageOutset: string | null;
    borderImageRepeat: string | null;
    borderImageSlice: string | null;
    borderImageSource: string | null;
    borderImageWidth: string | null;
    borderLeft: string | null;
    borderLeftColor: string | null;
    borderLeftStyle: string | null;
    borderLeftWidth: string | null;
    borderRadius: string | null;
    borderRight: string | null;
    borderRightColor: string | null;
    borderRightStyle: string | null;
    borderRightWidth: string | null;
    borderSpacing: string | null;
    borderStyle: string | null;
    borderTop: string | null;
    borderTopColor: string | null;
    borderTopLeftRadius: string | null;
    borderTopRightRadius: string | null;
    borderTopStyle: string | null;
    borderTopWidth: string | null;
    borderWidth: string | null;
    bottom: string | null;
    boxShadow: string | null;
    boxSizing: string | null;
    breakAfter: string | null;
    breakBefore: string | null;
    breakInside: string | null;
    captionSide: string | null;
    clear: string | null;
    clip: string | null;
    clipPath: string | null;
    clipRule: string | null;
    color: string | null;
    colorInterpolationFilters: string | null;
    columnCount: any;
    columnFill: string | null;
    columnGap: any;
    columnRule: string | null;
    columnRuleColor: any;
    columnRuleStyle: string | null;
    columnRuleWidth: any;
    columns: string | null;
    columnSpan: string | null;
    columnWidth: any;
    content: string | null;
    counterIncrement: string | null;
    counterReset: string | null;
    cssFloat: string | null;
    cursor: string | null;
    direction: string | null;
    display: string | null;
    dominantBaseline: string | null;
    emptyCells: string | null;
    enableBackground: string | null;
    fill: string | null;
    fillOpacity: string | null;
    fillRule: string | null;
    filter: string | null;
    flex: string | null;
    flexBasis: string | null;
    flexDirection: string | null;
    flexFlow: string | null;
    flexGrow: string | null;
    flexShrink: string | null;
    flexWrap: string | null;
    floodColor: string | null;
    floodOpacity: string | null;
    font: string | null;
    fontFamily: string | null;
    fontFeatureSettings: string | null;
    fontSize: string | null;
    fontSizeAdjust: string | null;
    fontStretch: string | null;
    fontStyle: string | null;
    fontVariant: string | null;
    fontWeight: string | null;
    glyphOrientationHorizontal: string | null;
    glyphOrientationVertical: string | null;
    height: string | null;
    imeMode: string | null;
    justifyContent: string | null;
    kerning: string | null;
    layoutGrid: string | null;
    layoutGridChar: string | null;
    layoutGridLine: string | null;
    layoutGridMode: string | null;
    layoutGridType: string | null;
    left: string | null;
    letterSpacing: string | null;
    lightingColor: string | null;
    lineBreak: string | null;
    lineHeight: string | null;
    listStyle: string | null;
    listStyleImage: string | null;
    listStylePosition: string | null;
    listStyleType: string | null;
    margin: string | null;
    marginBottom: string | null;
    marginLeft: string | null;
    marginRight: string | null;
    marginTop: string | null;
    marker: string | null;
    markerEnd: string | null;
    markerMid: string | null;
    markerStart: string | null;
    mask: string | null;
    maxHeight: string | null;
    maxWidth: string | null;
    minHeight: string | null;
    minWidth: string | null;
    msContentZoomChaining: string | null;
    msContentZooming: string | null;
    msContentZoomLimit: string | null;
    msContentZoomLimitMax: any;
    msContentZoomLimitMin: any;
    msContentZoomSnap: string | null;
    msContentZoomSnapPoints: string | null;
    msContentZoomSnapType: string | null;
    msFlowFrom: string | null;
    msFlowInto: string | null;
    msFontFeatureSettings: string | null;
    msGridColumn: any;
    msGridColumnAlign: string | null;
    msGridColumns: string | null;
    msGridColumnSpan: any;
    msGridRow: any;
    msGridRowAlign: string | null;
    msGridRows: string | null;
    msGridRowSpan: any;
    msHighContrastAdjust: string | null;
    msHyphenateLimitChars: string | null;
    msHyphenateLimitLines: any;
    msHyphenateLimitZone: any;
    msHyphens: string | null;
    msImeAlign: string | null;
    msOverflowStyle: string | null;
    msScrollChaining: string | null;
    msScrollLimit: string | null;
    msScrollLimitXMax: any;
    msScrollLimitXMin: any;
    msScrollLimitYMax: any;
    msScrollLimitYMin: any;
    msScrollRails: string | null;
    msScrollSnapPointsX: string | null;
    msScrollSnapPointsY: string | null;
    msScrollSnapType: string | null;
    msScrollSnapX: string | null;
    msScrollSnapY: string | null;
    msScrollTranslation: string | null;
    msTextCombineHorizontal: string | null;
    msTextSizeAdjust: any;
    msTouchAction: string | null;
    msTouchSelect: string | null;
    msUserSelect: string | null;
    msWrapFlow: string;
    msWrapMargin: any;
    msWrapThrough: string;
    opacity: string | null;
    order: string | null;
    orphans: string | null;
    outline: string | null;
    outlineColor: string | null;
    outlineOffset: string | null;
    outlineStyle: string | null;
    outlineWidth: string | null;
    overflow: string | null;
    overflowX: string | null;
    overflowY: string | null;
    padding: string | null;
    paddingBottom: string | null;
    paddingLeft: string | null;
    paddingRight: string | null;
    paddingTop: string | null;
    pageBreakAfter: string | null;
    pageBreakBefore: string | null;
    pageBreakInside: string | null;
    parentRule:  SEnvCSSRuleInterface;
    perspective: string | null;
    perspectiveOrigin: string | null;
    pointerEvents: string | null;
    position: string | null;
    quotes: string | null;
    right: string | null;
    rotate: string | null;
    rubyAlign: string | null;
    rubyOverhang: string | null;
    rubyPosition: string | null;
    scale: string | null;
    stopColor: string | null;
    stopOpacity: string | null;
    stroke: string | null;
    strokeDasharray: string | null;
    strokeDashoffset: string | null;
    strokeLinecap: string | null;
    strokeLinejoin: string | null;
    strokeMiterlimit: string | null;
    strokeOpacity: string | null;
    strokeWidth: string | null;
    tableLayout: string | null;
    textAlign: string | null;
    textAlignLast: string | null;
    textAnchor: string | null;
    textDecoration: string | null;
    textIndent: string | null;
    textJustify: string | null;
    textKashida: string | null;
    textKashidaSpace: string | null;
    textOverflow: string | null;
    textShadow: string | null;
    textTransform: string | null;
    textUnderlinePosition: string | null;
    top: string | null;
    touchAction: string | null;
    transform: string | null;
    transformOrigin: string | null;
    transformStyle: string | null;
    transition: string | null;
    transitionDelay: string | null;
    transitionDuration: string | null;
    transitionProperty: string | null;
    transitionTimingFunction: string | null;
    translate: string | null;
    unicodeBidi: string | null;
    verticalAlign: string | null;
    visibility: string | null;
    webkitAlignContent: string | null;
    webkitAlignItems: string | null;
    webkitAlignSelf: string | null;
    webkitAnimation: string | null;
    webkitAnimationDelay: string | null;
    webkitAnimationDirection: string | null;
    webkitAnimationDuration: string | null;
    webkitAnimationFillMode: string | null;
    webkitAnimationIterationCount: string | null;
    webkitAnimationName: string | null;
    webkitAnimationPlayState: string | null;
    webkitAnimationTimingFunction: string | null;
    webkitAppearance: string | null;
    webkitBackfaceVisibility: string | null;
    webkitBackgroundClip: string | null;
    webkitBackgroundOrigin: string | null;
    webkitBackgroundSize: string | null;
    webkitBorderBottomLeftRadius: string | null;
    webkitBorderBottomRightRadius: string | null;
    webkitBorderImage: string | null;
    webkitBorderRadius: string | null;
    webkitBorderTopLeftRadius: string | null;
    webkitBorderTopRightRadius: string | null;
    webkitBoxAlign: string | null;
    webkitBoxDirection: string | null;
    webkitBoxFlex: string | null;
    webkitBoxOrdinalGroup: string | null;
    webkitBoxOrient: string | null;
    webkitBoxPack: string | null;
    webkitBoxSizing: string | null;
    webkitColumnBreakAfter: string | null;
    webkitColumnBreakBefore: string | null;
    webkitColumnBreakInside: string | null;
    webkitColumnCount: any;
    webkitColumnGap: any;
    webkitColumnRule: string | null;
    webkitColumnRuleColor: any;
    webkitColumnRuleStyle: string | null;
    webkitColumnRuleWidth: any;
    webkitColumns: string | null;
    webkitColumnSpan: string | null;
    webkitColumnWidth: any;
    webkitFilter: string | null;
    webkitFlex: string | null;
    webkitFlexBasis: string | null;
    webkitFlexDirection: string | null;
    webkitFlexFlow: string | null;
    webkitFlexGrow: string | null;
    webkitFlexShrink: string | null;
    webkitFlexWrap: string | null;
    webkitJustifyContent: string | null;
    webkitOrder: string | null;
    webkitPerspective: string | null;
    webkitPerspectiveOrigin: string | null;
    webkitTapHighlightColor: string | null;
    webkitTextFillColor: string | null;
    webkitTextSizeAdjust: any;
    webkitTextStroke: string | null;
    webkitTextStrokeColor: string | null;
    webkitTextStrokeWidth: string | null;
    webkitTransform: string | null;
    webkitTransformOrigin: string | null;
    webkitTransformStyle: string | null;
    webkitTransition: string | null;
    webkitTransitionDelay: string | null;
    webkitTransitionDuration: string | null;
    webkitTransitionProperty: string | null;
    webkitTransitionTimingFunction: string | null;
    webkitUserModify: string | null;
    webkitUserSelect: string | null;
    webkitWritingMode: string | null;
    whiteSpace: string | null;
    widows: string | null;
    width: string | null;
    wordBreak: string | null;
    wordSpacing: string | null;
    wordWrap: string | null;
    writingMode: string | null;
    zIndex: string | null;
    zoom: string | null;
    resize: string | null;
    userSelect: string | null;
    [index: number]: string;
    $length;
    $id: string;
    private _struct: SyntheticCSSStyleDeclaration;

    disabledProperties?: {
      [identifier: string]: string
    }

    constructor(private _onChange?: () => any) {
      this.$id = generateDefaultId();
    }
    
    get struct() {
      if (this._struct) {
        return this._struct;
      }

      const props = {};
      for (let i = 0; i < this.length; i++) {
        props[i] = this[i];
        props[this[i]] = this[this[i]];
      }

      return this._struct = createSyntheticCSSStyleDeclaration({ 
        $id: this.$id, 
        instance: this,
        length: this.length,
        disabledPropertyNames: this.disabledProperties && {...this.disabledProperties},
        ...props
      });
    }

    get length() {
      return this.$length || 0;
    }
    
    public toggle(propertyName: string) {
      if (!this.disabledProperties) {
        this.disabledProperties = { };
      }
      
      if (this.disabledProperties[propertyName]) {
        this.setProperty(propertyName, this.disabledProperties[propertyName]);
        this.disabledProperties[propertyName] = undefined;
      } else {
        this.disabledProperties[propertyName] = this[propertyName];
        this.setProperty(propertyName, "");
      }
    }

    get cssText() {
      
      const buffer = [];

      for (let i = 0, n = this.length; i < n; i++) {
        const key = this[i];
        const value = this[key] || this.disabledProperties[key];
        if (value) {
          buffer.push(cssPropNameToKebabCase(key), ": ", value, ";");
        }
      }

      return buffer.join("");
    }

    get previewCSSText() {
      const buffer = [];

      for (let i = 0, n = this.length; i < n; i++) {
        const key = this[i];
        let value = this[key];
        if (value) {
          if (/url\(.*\)/.test(value)) {
            const styleSheetHref = this.parentRule.parentStyleSheet.href;
            value = value.replace(/url\(.*?\)/g, (token) => {
              const href = token.match(/url\(["']?(.*?)["']?\)/)[1];
              const url =  getUri(href, styleSheetHref);
              return `url("${getProxyUrl(url)}")`;
            });
          }
          buffer.push(cssPropNameToKebabCase(key), ": ", value, ";");
        }
      }

      return buffer.join("");
    }

    set cssText(value: string) {

      const props = parseStyleSource(value);
      this.disabledProperties = {};
      for (let i = 0, n = this.length; i < n; i++) {
        this[this[i]] = undefined;
      }
      Object.assign(this, props);
      this.$updatePropertyIndices();
      this.didChange(cssStyleDeclarationSetProperties(this, props), true);
    }

    static fromString(source: string) {
      const decl = new SEnvCSSStyleDeclaration();
      Object.assign(decl, parseStyleSource(source));
      decl.$updatePropertyIndices();
      return decl;
    }

    static fromObject(declaration: any) {
      const decl = new SEnvCSSStyleDeclaration();
      if (declaration.length != null) {
        for (let i = 0, n = declaration.length; i < n; i++) {
          const key = declaration[i];
          decl[key] = declaration[key];
        }
        decl.$updatePropertyIndices();
      } else {
        for (const key in declaration) {
          if (isValidCSSDeclarationProperty(key)) {
            decl[getJSPropName(key)] = declaration[key];
          }
        }
        decl.$updatePropertyIndices();
      }
      return decl;
    }

    public didChange(mutation: Mutation<any>, notifyOwnerNode?: boolean) {
      this._struct = undefined;
      if (this.parentRule) {
        this.parentRule.didChange(mutation, notifyOwnerNode);
      }
      if (this._onChange) {
        this._onChange();
      }
    }
    
    getPropertyPriority(propertyName: string): string {
      return null;
    }
    getPropertyValue(propertyName: string): string {
      return null;
    }
    item(index: number): string {
      return null;
    }
    removeProperty(propertyName: string): string {
      this.setProperty(propertyName, null, null);
      return null;
    }

    getProperties() {
      const props = [];
      for (let i = 0, n = this.length || 0; i < n; i++) {
        props.push(this[i]);
      }
      return props;
    }

    getPropertyIndex(name: string) {
      return this.getProperties().indexOf(name);
    }

    setProperty(name: string, newValue: string | null, priority?: string, oldName?: string, notifyOwnerNode: boolean = true): boolean {

      if (!isValidCSSDeclarationProperty(name)) return false;

      // fix in case they"re kebab case
      name    = getJSPropName(name);
      oldName = oldName != null ? getJSPropName(oldName) : oldName;

      let index = oldName ? this.getPropertyIndex(oldName) : this.getPropertyIndex(name);

      // ensure that internal keys are not set
      if (!/^\$/.test(name)) {
        this[~index ? index : this.length] = name;
      }

      if (name != null) {
        this[name] = newValue;
      }

      if (oldName != null) {
        this[oldName] = undefined;
      }

      this.$updatePropertyIndices();
      this.didChange(cssStyleDeclarationSetProperty(this, name, newValue), notifyOwnerNode);
    }

    public $updatePropertyIndices() {

      const model = {};

      for (let i = 0; i < this.length; i++) {
        const key = this[i];
        const value = this[key];

        if (value != null) {
          model[key + ""] = value;
        }

        // reset for now
        this[i] = undefined;
      }

      for (const key in this) {
        if (!this.hasOwnProperty(key) || !isValidCSSDeclarationProperty(key)) continue;
        if (this[key] == null) continue;
        model[key + ""] = this[key];
      }

      let i = 0;
      for (const key in model) {
        this[i++] = key;
      }

      this.$length = Object.keys(model).length;
    }

    clone() {
      return SEnvCSSStyleDeclaration.fromObject(this);
    }
  }
});

export const CSS_STYLE_DECLARATION_SET_PROPERTY = "CSS_STYLE_DECLARATION_SET_PROPERTY"; 
export const CSS_STYLE_DECLARATION_RESET_PROPERTIES = "CSS_STYLE_DECLARATION_RESET_PROPERTIES"; 

export const cssStyleDeclarationMutators = {
  [CSS_STYLE_DECLARATION_SET_PROPERTY](target: SEnvCSSStyleDeclarationInterface, mutation: SetPropertyMutation<any>) {
    if (!mutation.newValue) {
      target.removeProperty(cssPropNameToKebabCase(mutation.name));
    } else {
      target.setProperty(cssPropNameToKebabCase(mutation.name), mutation.newValue, null, null, true);
    }
  },
  [CSS_STYLE_DECLARATION_RESET_PROPERTIES](target: SEnvCSSStyleDeclarationInterface, mutation: SetValueMutation<any>) {
    for (const property in target) {
      if (isValidCSSDeclarationProperty(property)) {
        target[property] = undefined;
      }
    }
    for (const propery in mutation.newValue) {
      target[propery] = mutation.newValue[propery];
    }
    target.$updatePropertyIndices();
  }
}

export const cssStyleDeclarationSetProperty = (target: CSSStyleDeclaration, key: string, value: string) => createPropertyMutation(CSS_STYLE_DECLARATION_SET_PROPERTY, target, key, value);

export const cssStyleDeclarationSetProperties = (target: CSSStyleDeclaration, properties: any) => createSetValueMutation(CSS_STYLE_DECLARATION_RESET_PROPERTIES, target, properties);

export const diffCSStyleDeclaration = (oldStyle: CSSStyleDeclaration, newStyle: CSSStyleDeclaration) => {
  const oldKeys = Object.keys(oldStyle).filter(isValidCSSDeclarationProperty);
  const newKeys = Object.keys(newStyle).filter(isValidCSSDeclarationProperty);

  const diffs = diffArray(oldKeys, newKeys, (a, b) => a === b ? 0 : -1);
  
  const mutations = [];

  eachArrayValueMutation(diffs, {
    insert({ value: key }) {
      mutations.push(cssStyleDeclarationSetProperty(oldStyle, key, newStyle[key]));
    },
    delete({ value: key }) {
      mutations.push(cssStyleDeclarationSetProperty(oldStyle, key, undefined));
    },
    update({ newValue: key }) {
      if (oldStyle[key] !== newStyle[key]) {
        mutations.push(cssStyleDeclarationSetProperty(oldStyle, key, newStyle[key]));
      }
    }
  });

  return mutations;
}