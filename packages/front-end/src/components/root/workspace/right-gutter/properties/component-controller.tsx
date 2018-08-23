import * as React from "react";
import * as path from "path";
import * as cx from "classnames";
import { ControllerItem } from "./controller-item.pc";
import { compose, pure, withHandlers } from "recompose";
import {
  PCComponent,
  getSyntheticSourceNode,
  PCSourceTagNames,
  SyntheticElement,
  DependencyGraph
} from "paperclip";
import { EMPTY_ARRAY, stripProtocol } from "tandem-common";
import {
  addComponentControllerButtonClicked,
  removeComponentControllerButtonClicked
} from "actions";
import {
  BaseComponentPropertiesProps,
  BaseControllersPaneProps
} from "./view.pc";
import { Dispatch } from "redux";

export type Props = {
  selectedNodes: SyntheticElement[];
  graph: DependencyGraph;
  selectedControllerRelativePath: string;
  dispatch: Dispatch;
  sourceNodeUri: string;
} & BaseComponentPropertiesProps;

type InnerProps = {
  onRemoveControllerClick: any;
  onAddControllerClick: any;
} & Props;

export default compose<BaseControllersPaneProps, Props>(
  pure,
  withHandlers({
    onRemoveControllerClick: ({ dispatch }) => () => {
      dispatch(removeComponentControllerButtonClicked());
    },
    onAddControllerClick: ({ dispatch, sourceNodeUri }) => () => {
      dispatch(
        addComponentControllerButtonClicked(
          path.dirname(stripProtocol(sourceNodeUri))
        )
      );
    }
  }),
  (Base: React.ComponentClass<BaseControllersPaneProps>) => ({
    selectedNodes,
    graph,
    selectedControllerRelativePath,
    onRemoveControllerClick,
    onAddControllerClick,
    dispatch,
    ...rest
  }: InnerProps) => {
    if (!graph) {
      return null;
    }
    if (!selectedNodes.length) {
      return null;
    }

    const sourceNode = getSyntheticSourceNode(
      selectedNodes[0],
      graph
    ) as PCComponent;

    if (sourceNode.name !== PCSourceTagNames.COMPONENT) {
      return null;
    }

    const hasControllerSelected =
      (sourceNode.controllers || EMPTY_ARRAY).indexOf(
        selectedControllerRelativePath
      ) !== -1;

    const controllers = (sourceNode.controllers || EMPTY_ARRAY).map(
      (relativePath, i) => {
        return (
          <ControllerItem
            key={relativePath + i}
            dispatch={dispatch}
            selected={selectedControllerRelativePath === relativePath}
            relativePath={relativePath}
          />
        );
      }
    );
    return (
      <Base
        {...rest}
        variant={cx({ hasControllerSelected })}
        removeControllerButtonProps={{ onClick: onRemoveControllerClick }}
        addControllerButtonProps={{ onClick: onAddControllerClick }}
        content={controllers}
      />
    );
  }
);
