import "./index.scss";
import * as React from "react";
import { compose, pure, withHandlers } from "recompose";
import { Resizer } from "./resizer";
import { Dispatch } from "redux";
import {
  RootState,
  getBoundedSelection,
  EditorWindow,
  getSelectionBounds,
  Canvas
} from "../../../../../../../../../state";
import { selectorDoubleClicked } from "../../../../../../../../../actions";
import { getSyntheticVisibleNodeFrame, getSyntheticNodeById } from "paperclip";

export type SelectionOuterProps = {
  canvas: Canvas;
  dispatch: Dispatch<any>;
  zoom: number;
  root: RootState;
  editorWindow: EditorWindow;
};

export type SelectionInnerProps = {
  setSelectionElement(element: HTMLDivElement);
  onDoubleClick(event: React.MouseEvent<any>);
} & SelectionOuterProps;

const SelectionBounds = ({
  root,
  zoom
}: {
  root: RootState;
  zoom: number;
}) => {
  const entireBounds = getSelectionBounds(root);
  const frame = getSyntheticVisibleNodeFrame(getSyntheticNodeById(root.selectedNodeIds[0], root.documents), root.frames);
  const borderWidth = 1 / zoom;
  const boundsStyle = {
    position: "absolute",
    top: entireBounds.top,
    left: entireBounds.left,

    // round bounds so that they match up with the NWSE resizer
    width: entireBounds.right - entireBounds.left,
    height: entireBounds.bottom - entireBounds.top,
    boxShadow: `inset 0 0 0 ${borderWidth}px #00B5FF`
  };

  return <div style={boundsStyle as any} />;
};

export const SelectionCanvasToolBase = ({
  canvas,
  editorWindow,
  root,
  dispatch,
  onDoubleClick,
  zoom
}: SelectionInnerProps) => {
  const selection = getBoundedSelection(root);
  if (!selection.length || editorWindow.secondarySelection) return null;

  return (
    <div className="m-stage-selection-tool" onDoubleClick={onDoubleClick}>
      <SelectionBounds root={root} zoom={zoom}  />
      <Resizer
        root={root}
        editorWindow={editorWindow}
        canvas={canvas}
        dispatch={dispatch}
        zoom={zoom}
      />
    </div>
  );
};

const enhanceSelectionCanvasTool = compose<
  SelectionInnerProps,
  SelectionOuterProps
>(
  pure,
  withHandlers({
    onDoubleClick: ({ dispatch, root }: SelectionInnerProps) => (
      event: React.MouseEvent<any>
    ) => {
      const selection = getBoundedSelection(root);
      if (selection.length === 1) {
        dispatch(selectorDoubleClicked(selection[0], event));
      }
    }
  })
);

export const SelectionCanvasTool = enhanceSelectionCanvasTool(
  SelectionCanvasToolBase
);

export * from "./resizer";
