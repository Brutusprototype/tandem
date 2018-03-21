import { SEnvNodeTypes } from "../constants";
import { getSEnvEventClasses } from "../events";
import { SEnvWindowInterface } from "../window";
import { SEnvDocumentInterface } from "./document";
import { getDOMExceptionClasses } from "./exceptions";
import { getSEnvEventTargetClass, SEnvMutationEventInterface } from "../events";
import { UPDATE_VALUE_NODE } from "./constants";
import { getSEnvNamedNodeMapClass } from "./named-node-map";
import { getSEnvHTMLCollectionClasses, SEnvNodeListInterface } from "./collections";
import { 
  weakMemo, 
  generateDefaultId, 
  ExpressionLocation, 
  expressionLocationEquals,
} from "aerial-common2";
import { Mutation, Mutator, SetValueMutation, SetPropertyMutation, createPropertyMutation, createSetValueMutation, eachArrayValueMutation, diffArray, RemoveChildMutation, createStringMutation, createInsertChildMutation, createMoveChildMutation, InsertChildMutation, MoveChildMutation, createRemoveChildMutation } from "source-mutation";
import { SEnvParentNodeInterface } from "./parent-node";
import { SyntheticNode, SyntheticValueNode, BasicValueNode, BasicNode } from "../../state";

export interface SEnvNodeInterface extends Node {
  $id: string;
  structType: string;
  struct: SyntheticNode;
  source: ExpressionLocation;
  contentLoaded: Promise<any>;
  ownerDocument: SEnvDocumentInterface;
  interactiveLoaded: Promise<any>;
  connectedToDocument: boolean;
  slottedCallback();
  unslottedCallback();
  $$setOwnerDocument(document: SEnvDocumentInterface);
  $$parentNode: Node;
  $$canBubbleParent: boolean;
  $$setAssignedSlot(value: HTMLSlotElement);
  setSource(source: ExpressionLocation): any;
  $$parentElement: HTMLElement;
  $$setConnectedToDocument(value: boolean);
  $$removedFromDocument();
  dispatchMutationEvent(mutation: Mutation<any>);
};

export const getSEnvNodeClass = weakMemo((context: any) => {
  
  const SEnvEventTarget = getSEnvEventTargetClass(context);
  const SEnvNamedNodeMap = getSEnvNamedNodeMapClass(context);
  const { SEnvNodeList } =  getSEnvHTMLCollectionClasses(context);
  const { SEnvDOMException } =  getDOMExceptionClasses(context);
  const { SEnvMutationEvent } =  getSEnvEventClasses(context);

  return class SEnvNode extends SEnvEventTarget implements SEnvNodeInterface {

    cloned: boolean;
    public $$canBubbleParent: boolean;
    public $$parentNode: SEnvParentNodeInterface;
    public $$parentElement: HTMLElement;
    public $type: string;
    public contentLoaded: Promise<any>;
    public interactiveLoaded: Promise<any>;
    public source: ExpressionLocation;
    private _struct: SyntheticNode;
    private _constructed: boolean;
    readonly structType: string;

    readonly attributes: NamedNodeMap;
    readonly baseURI: string | null;
    childNodes: SEnvNodeListInterface;
    readonly localName: string | null;
    readonly namespaceURI: string | null;
    nodeName: string;
    readonly nodeType: number;
    nodeValue: string | null;
    private _ownerDocument: SEnvDocumentInterface;
    textContent: string | null;
    private _initialized: boolean;
    private _$id: string;
    readonly ATTRIBUTE_NODE: number;
    readonly CDATA_SECTION_NODE: number;
    readonly COMMENT_NODE: number;
    readonly DOCUMENT_FRAGMENT_NODE: number;
    readonly DOCUMENT_NODE: number;
    readonly DOCUMENT_POSITION_CONTAINED_BY: number;
    readonly DOCUMENT_POSITION_CONTAINS: number;
    readonly DOCUMENT_POSITION_DISCONNECTED: number;
    readonly DOCUMENT_POSITION_FOLLOWING: number;
    readonly DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: number;
    readonly DOCUMENT_POSITION_PRECEDING: number;
    readonly DOCUMENT_TYPE_NODE: number;
    readonly ELEMENT_NODE: number;
    readonly ENTITY_NODE: number;
    readonly ENTITY_REFERENCE_NODE: number;
    readonly NOTATION_NODE: number;
    readonly PROCESSING_INSTRUCTION_NODE: number;
    readonly TEXT_NODE: number;
    private _assignedSlot: HTMLSlotElement | null;

    get assignedSlot() {
      return this._assignedSlot;
    }
    
    $$setAssignedSlot(value: HTMLSlotElement) {
      this._assignedSlot = value;
      if (value) {
        this.slottedCallback();
      } else {
        this.unslottedCallback();
      }
    }

    get $id() {
      return this._$id;
    }

    set $id(value: string) {
      this._$id = value;

      // TODO - probably want to dispatch a mutation change
      this._struct = undefined;
    }

    childNodesArray: Node[];

    connectedToDocument: boolean;

    constructor() {
      super();
      this.$id = generateDefaultId();
      this.childNodes = this.childNodesArray = new SEnvNodeList();

      // called specifically for elements
      if (this._constructed) {
        throw new Error(`Cannot call constructor twice.`);
      }
      this._constructed = true;
      this.addEventListener(SEnvMutationEvent.MUTATION, this._onMutation.bind(this));
    }

    initialize() {

    }

    get ownerDocument() {
      return this._ownerDocument;
    }

    get nextSibling() {
      return this.parentNode.childNodes[Array.prototype.indexOf.call(this.parentNode.childNodes, this) + 1];
    }

    get previousSibling() {
      return this.parentNode.childNodes[Array.prototype.indexOf.call(this.parentNode.childNodes, this) - 1];
    }

    get offsetParent(): Element {

      // TODO - read the docs: https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent
      // Impl here is partial.
      return this.parentNode as any as Element;
    }

    get parentNode() {
      return this.$$parentNode;
    }

    get parentElement() {
      return this.$$parentNode as any as HTMLElement;
    }

    get firstChild() {
      return this.childNodes[0];
    }

    get lastChild() {
      return this.childNodes[this.childNodes.length - 1];
    }

    get struct(): SyntheticNode {
      if (!this._struct) {
        this.updateStruct();
      }
      return this._struct;
    }

    setSource(source: ExpressionLocation) {
      this.source = source;
      this.dispatchMutationEvent(createSyntheticSourceChangeMutation(this, source));
    }

    protected updateStruct() {
      this._struct = this.createStruct();
    }

    

    protected createStruct(): SyntheticNode {
      return {
        parentId: this.parentNode ? this.parentNode.$id : null,
        nodeType: this.nodeType,
        nodeName: this.nodeName,
        source: this.source,
        instance: this,
        $type: this.structType,
        $id: this.$id
      };
    }

    protected _linkChild(child) {

    }

    appendChild<T extends Node>(newChild: T): T {
      this._throwUnsupportedMethod();
      return null;
    }

    cloneNode(deep?: boolean): Node {
      const clone = this.cloneShallow();
      clone["" + "nodeName"] = this.nodeName;
      clone["" + "_initialized"] = this._initialized;
      clone.source = this.source;
      clone.$id    = this.$id;

      if (deep !== false) {
        for (let i = 0, n = this.childNodes.length; i < n; i++) {
          const child = this.childNodes[i].cloneNode(true);

          // do NOT call appendChild to ensure that mutation events
          // aren't triggered.
          Array.prototype.push.call(clone.childNodes, child);
          clone["" + "_linkChild"](child);
        }
      }
      return clone;
    }

    cloneShallow(): SEnvNodeInterface {
      this._throwUnsupportedMethod();
      return null;
    }

    compareDocumentPosition(other: Node): number {
      return 0;
    }

    contains(child: Node): boolean {
      return Array.prototype.indexOf.call(this.childNodes, child) !== -1;
    }
    
    remove() {
      if (this.parentNode) {
        this.parentNode.removeChild(this);
      }
    }

    hasAttributes(): boolean {
      return this.attributes.length > 0;
    }

    hasChildNodes(): boolean {
      return this.childNodes.length > 0;
    }

    insertBefore<T extends Node>(newChild: T, refChild: Node | null): T {
      this._throwUnsupportedMethod();
      return null;
    }
    isDefaultNamespace(namespaceURI: string | null): boolean {
      return false;
    }

    isEqualNode(arg: Node): boolean {
      return false;
    }

    isSameNode(other: Node): boolean {
      return false;
    }

    lookupNamespaceURI(prefix: string | null): string | null {
      this._throwUnsupportedMethod();
      return null;
    }

    lookupPrefix(namespaceURI: string | null): string | null {
      this._throwUnsupportedMethod();
      return null;
    }

    normalize(): void { }

    removeChild<T extends Node>(oldChild: T): T {
      this._throwUnsupportedMethod();
      return null;
    }

    protected connectedCallback() {
      if (this._initialized) {
        this.initialize();
      }
    }

    protected disconnectedCallback() {

    }

    protected paintedCallback() {
      // override me
    }

    protected _onMutation(event: SEnvMutationEventInterface) {
      this._struct = undefined;
    }

    // non-standard
    slottedCallback() {
      for (let i = 0, {length} = this.childNodes; i < length; i++) {
        (this.childNodes[i] as SEnvNodeInterface).slottedCallback();
      }
    }

    unslottedCallback() {
      for (let i = 0, {length} = this.childNodes; i < length; i++) {
        (this.childNodes[i] as SEnvNodeInterface).unslottedCallback();
      }
    }
    replaceChild<T extends Node>(newChild: Node, oldChild: T): T {
      this._throwUnsupportedMethod();
      return null;
    }

    protected _throwUnsupportedMethod() {
      throw new SEnvDOMException("This node (" + this["constructor"].name + ") type does not support this method.");
    }

    $$setConnectedToDocument(value: boolean) {
      if (this.connectedToDocument === value) {
        return;
      }
      this.connectedToDocument = value;
      if (value) {
        this.connectedCallback();
      } else {
        this.disconnectedCallback();
      }

      for (const child of this.childNodes) {
        child.$$setConnectedToDocument(value);
      }
    }

    private _getDefaultView() {
      return this.nodeType === SEnvNodeTypes.DOCUMENT ? (this as any as SEnvDocumentInterface).defaultView : this.ownerDocument.defaultView as SEnvWindowInterface;
    }

    $$setOwnerDocument(document: SEnvDocumentInterface) {
      if (this.ownerDocument === document) {
        return;
      }
      this._ownerDocument = document;
      
      if (this.childNodes) {
        for (const child of this.childNodes) {
          (child as SEnvNodeInterface).$$setOwnerDocument(document);
        }
      }
    }

    $$removedFromDocument() {
      this.connectedToDocument = false;
    }

    dispatchEvent(event: Event): boolean {
      super.dispatchEvent(event);

      // do not bubble if still constructing
      if (this.$$canBubbleParent && event.bubbles && this.$$parentNode) {
        this.$$parentNode.dispatchEvent(event);
      }
      return true;
    }

    dispatchMutationEvent(mutation: Mutation<any>) {
      const e = new SEnvMutationEvent();
      e.initMutationEvent(mutation);
      this.dispatchEvent(e);
    }
  }
});

export const getSEnvValueNode = weakMemo((context) => {
  const SEnvNode = getSEnvNodeClass(context);
  const { SEnvMutationEvent } = getSEnvEventClasses(context);
  

  return class SenvValueNode extends SEnvNode {
    constructor(private _nodeValue: string)  {
      super();
    }

    get nodeValue() {
      return this._nodeValue;
    }

    createStruct(): SyntheticValueNode {
      return {
        ...(super.createStruct() as any),
        nodeValue: this._nodeValue
      }
    }

    set nodeValue(value: string) {
      this._nodeValue = value;
      this.dispatchMutationEvent(createPropertyMutation(UPDATE_VALUE_NODE, this, "nodeValue", value, undefined));
    }
  }
});


export const SET_SYNTHETIC_SOURCE_CHANGE = "SET_SYNTHETIC_SOURCE_CHANGE";
export const createSyntheticSourceChangeMutation = (target: any, value: ExpressionLocation) => createPropertyMutation(SET_SYNTHETIC_SOURCE_CHANGE, target, "source", value);

export const diffNodeBase = (oldNode: Partial<SEnvNodeInterface>, newNode: Partial<SEnvNodeInterface>) => {
  const mutations = [];

  if (!expressionLocationEquals(oldNode.source, newNode.source)) {
    mutations.push(createSyntheticSourceChangeMutation(oldNode, newNode.source));
  }

  return mutations;
};

export const nodeMutators = {
  [SET_SYNTHETIC_SOURCE_CHANGE](oldNode: SEnvNodeInterface, {newValue}: SetPropertyMutation<any>) {

    // may not exist if oldNode is a DOM node
    if (oldNode.setSource) {
      oldNode.setSource(newValue && JSON.parse(JSON.stringify(newValue)) as ExpressionLocation);
    }
  }
};

export const createUpdateValueNodeMutation = (oldNode: BasicValueNode, newValue: string) => {
  return createSetValueMutation(UPDATE_VALUE_NODE, oldNode, newValue);
};

export const diffValueNode = (oldNode: BasicValueNode, newNode: BasicValueNode) => {
  const mutations = [];
  if(oldNode.nodeValue !== newNode.nodeValue) {
    mutations.push(createUpdateValueNodeMutation(oldNode, newNode.nodeValue));
  }
  return [...mutations, ...diffNodeBase(oldNode, newNode)];
};

export const valueNodeMutators = {
  [UPDATE_VALUE_NODE](oldNode: BasicValueNode, { newValue }: SetValueMutation<any>) {
    oldNode.nodeValue = newValue;
  }
};

export const baseNodeMutators = {
  ...nodeMutators,
  ...valueNodeMutators
};