import * as React from "react";
import {
  SyntheticNode,
  SyntheticElement,
  DependencyGraph,
  InspectorNode,
  SyntheticDocument,
  PCVariant,
  PCVariable,
  getSyntheticSourceNode,
  PCVisibleNode
} from "paperclip";
import { BaseElementStylerProps } from "./view.pc";
import { Dispatch } from "redux";
import { FontFamily } from "../../../../../../state";
import { ComputedStyleInfo } from "../state";

export type PrettyPaneOuterProps = {
  syntheticNodes: SyntheticNode[];
};

export type Props = {
  selectedVariant: PCVariant;
  dispatch: Dispatch<any>;
  selectedNodes: SyntheticElement[];
  graph: DependencyGraph;
  computedStyleInfo: ComputedStyleInfo;
  rootInspectorNode: InspectorNode;
  selectedInspectorNodes: InspectorNode[];
  syntheticDocument: SyntheticDocument;
  fontFamilies: FontFamily[];
  globalVariables: PCVariable[];
};

export default (Base: React.ComponentClass<BaseElementStylerProps>) =>
  class PrettyStylesController extends React.PureComponent<Props> {
    render() {
      const {
        dispatch,
        selectedVariant,
        computedStyleInfo,
        globalVariables,
        fontFamilies,
        selectedNodes,
        syntheticDocument,
        graph,
        selectedInspectorNodes,
        rootInspectorNode,
        ...rest
      } = this.props;
      const selectedNode = (selectedNodes.length ? getSyntheticSourceNode(selectedNodes[0], graph) : null) as PCVisibleNode;
      return (
        <Base
          {...rest}
          framePaneProps={{
            selectedNode,
            graph
          }}
          instancePaneProps={{
            selectedInspectorNodes,
            rootInspectorNode,
            syntheticDocument,
            dispatch,
            graph,
            selectedVariant
          }}
          inheritPaneProps={{
            dispatch,
            selectedNodes,
            graph
          }}
          codePaneProps={{
            dispatch,
            computedStyleInfo
          }}
          layoutPaneProps={{
            dispatch,
            globalVariables,
            selectedVariant,
            rootInspectorNode,
            selectedInspectorNodes,
            computedStyleInfo,
            graph
          }}
          typographyPaneProps={{
            dispatch,
            computedStyleInfo,
            fontFamilies,
            globalVariables
          }}
          opacityPaneProps={{
            dispatch,
            computedStyleInfo
          }}
          backgroundsPaneProps={{
            globalVariables,
            dispatch,
            computedStyleInfo
          }}
          spacingPaneProps={{
            dispatch,
            computedStyleInfo
          }}
          bordersPaneProps={{
            globalVariables,
            dispatch,
            computedStyleInfo
          }}
          outerShadowsPaneProps={{
            globalVariables,
            dispatch,
            computedStyleInfo
          }}
          innerShadowsPaneProps={{
            globalVariables,
            dispatch,
            computedStyleInfo
          }}
        />
      );
    }
  };
