import "./index.scss";
import * as React from "react";
import { Dispatch } from "redux";
import { compose, pure, withState, withHandlers } from "recompose";
import { RootState, getActiveWindow, CanvasToolType } from "front-end/state";
import { SyntheticWindow, Dependency } from "paperclip";
import { PreviewLayerComponent } from "./preview-layer";
import { ToolsLayerComponent } from "./tools-layer";
import { Isolate } from "front-end/components/isolated";
import { canvasWheel, canvasContainerMounted, canvasMouseMoved, canvasMouseClicked, canvasMotionRested } from "front-end/actions";

export type CanvasOuterProps = {
  root: RootState;
  dependency: Dependency;
  dispatch: Dispatch<any>;
};

export type CanvasInnerProps = {
  canvasOuter: HTMLElement;
  onWheel: (event: React.SyntheticEvent<MouseEvent>) => any;
  shouldTransitionZoom: boolean;
  canvasContainer: HTMLElement;
  setStageContainer(element: HTMLElement);
  onMotionRest: () => any;
  onDrop: (event: React.SyntheticEvent<any>) => any;
  onMouseEvent: (event: React.SyntheticEvent<any>) => any;
  onMouseClick: (event: React.SyntheticEvent<any>) => any;
  onDragOver: (event: React.SyntheticEvent<any>) => any;
  onDragExit: (event: React.SyntheticEvent<any>) => any;
  setCanvasOuter: (element: HTMLElement) => any;

} & CanvasOuterProps;

const onWheel = () => {};
const BaseCanvasComponent = ({
  root,
  dispatch,
  dependency,
  setCanvasOuter,
  setStageContainer,
  onWheel,
  onDrop,
  onMouseEvent,
  shouldTransitionZoom,
  onDragOver,
  onMouseClick,
  onMotionRest,
  onDragExit
}: CanvasInnerProps) => {
  const activeWindow = getActiveWindow(root);

  return <div className="m-canvas">
    <Isolate
    inheritCSS
    ignoreInputEvents
    className="canvas-component-isolate"
    onWheel={onWheel}
    scrolling={false}
    translateMousePositions={false}>
      <span>
        <style>
          {
            `html, body {
              overflow: hidden;
            }`
          }
        </style>

        <div
          ref={setCanvasOuter}
          onMouseMove={onMouseEvent}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onClick={onMouseClick}
          tabIndex={-1}
          onDragExit={onDragExit}
          className="stage-inner">
          <PreviewLayerComponent window={activeWindow} dependency={dependency} />
          <ToolsLayerComponent root={root} dispatch={dispatch} zoom={1} />
        </div>
      </span>
    </Isolate>
  </div>;
};

const enhance = compose<CanvasInnerProps, CanvasOuterProps>(
  pure,
  withState('canvasOuter', 'setCanvasOuter', null),
  withState('canvasContainer', 'setCanvasContainer', null),
  withHandlers({
    onMouseEvent: ({ dispatch }) => (event: React.MouseEvent<any>) => {
      dispatch(canvasMouseMoved(event));
    },
    onDragOver: ({ dispatch }) => (event) => {
      dispatch(canvasMouseMoved(event));
    },
    onMotionRest: ({ dispatch}) => () => {
      dispatch(canvasMotionRested());
    },
    onMouseClick: ({ dispatch }) => (event: React.MouseEvent<any>) => {
      dispatch(canvasMouseClicked(event));
    },
    setCanvasContainer: ({ dispatch, setStageContainer }) => (element: HTMLDivElement) => {
      setStageContainer(element);
      dispatch(canvasContainerMounted(element));
    },
    onWheel: ({ root, dispatch, canvasOuter }: CanvasInnerProps) => (event: React.WheelEvent<any>) => {
      const rect = canvasOuter.getBoundingClientRect();
      event.preventDefault();
      event.stopPropagation();
      dispatch(canvasWheel(rect.width, rect.height, event));
    }
  })
);

export const CanvasComponent = enhance(BaseCanvasComponent);