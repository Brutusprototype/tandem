import "./index.scss";
import * as React from "react";
import { Dispatch } from "redux";
import { compose, pure, withState, withHandlers } from "recompose";
import {
  RootState,
  Editor,
  ToolType,
  REGISTERED_COMPONENT,
  RegisteredComponent
} from "../../../../../../state";
import { SyntheticWindow, Dependency, getSyntheticWindow } from "paperclip";
import { PreviewLayerComponent } from "./preview-layer";
import { ToolsLayerComponent } from "./tools-layer";
import { Isolate } from "../../../../../isolated";
import {
  canvasWheel,
  canvasContainerMounted,
  canvasMouseMoved,
  canvasMouseClicked,
  canvasMotionRested,
  canvasDroppedRegisteredComponent,
  canvasDraggedOver
} from "../../../../../../actions";
import {
  DropTarget,
  DropTargetCollector,
  DragDropContextProvider,
  DropTargetMonitor
} from "react-dnd";

export type CanvasOuterProps = {
  root: RootState;
  editor: Editor;
  dependency: Dependency;
  dispatch: Dispatch<any>;
};

export type CanvasInnerProps = {
  canvasOuter: HTMLElement;
  connectDropTarget: any;
  onWheel: (event: React.SyntheticEvent<MouseEvent>) => any;
  shouldTransitionZoom: boolean;
  canvasContainer: HTMLElement;
  setCanvasContainer(element: HTMLElement);
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
  editor,
  setCanvasContainer,
  onWheel,
  onDrop,
  onMouseEvent,
  shouldTransitionZoom,
  onDragOver,
  onMouseClick,
  connectDropTarget,
  onMotionRest,
  onDragExit
}: CanvasInnerProps) => {
  const activeWindow = getSyntheticWindow(editor.activeFilePath, root.browser);

  const translate = editor.canvas.translate;

  return (
    <div className="m-canvas" ref={setCanvasContainer}>
      {/* isolate necessary here for bounding client rect information */}
      <Isolate
        inheritCSS
        ignoreInputEvents
        className="canvas-component-isolate"
        onWheel={onWheel}
        scrolling={false}
        translateMousePositions={false}
      >
        <span>
          <style>
            {`html, body {
                overflow: hidden;
              }`}
          </style>

          <div
            ref={setCanvasOuter}
            onMouseMove={onMouseEvent}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onClick={onMouseClick}
            tabIndex={-1}
            onDragExit={onDragExit}
            className="canvas-inner"
          >
            {connectDropTarget(
              <div
                style={{
                  transform: `translate(${translate.left}px, ${
                    translate.top
                  }px) scale(${translate.zoom})`,
                  transformOrigin: "top left"
                }}
              >
                <PreviewLayerComponent
                  window={activeWindow}
                  dependency={dependency}
                />
                <ToolsLayerComponent
                  root={root}
                  dispatch={dispatch}
                  zoom={translate.zoom}
                  editor={editor}
                />
              </div>
            )}
          </div>
        </span>
      </Isolate>
    </div>
  );
};

const enhance = compose<CanvasInnerProps, CanvasOuterProps>(
  pure,
  withState("canvasOuter", "setCanvasOuter", null),
  withState("canvasContainer", "setCanvasContainer", null),
  withHandlers({
    onMouseEvent: ({ dispatch }) => (event: React.MouseEvent<any>) => {
      dispatch(canvasMouseMoved(event));
    },
    onDragOver: ({ dispatch }) => event => {
      dispatch(canvasDraggedOver(event));
    },
    onMotionRest: ({ dispatch }) => () => {
      dispatch(canvasMotionRested());
    },
    onMouseClick: ({ dispatch }) => (event: React.MouseEvent<any>) => {
      dispatch(canvasMouseClicked(event));
    },
    setCanvasContainer: ({ dispatch, editor }) => (element: HTMLDivElement) => {
      dispatch(canvasContainerMounted(element, editor.activeFilePath));
    },
    onWheel: ({ root, dispatch, canvasOuter }: CanvasInnerProps) => (
      event: React.WheelEvent<any>
    ) => {
      const rect = canvasOuter.getBoundingClientRect();
      event.preventDefault();
      event.stopPropagation();
      dispatch(canvasWheel(rect.width, rect.height, event));
    }
  }),
  DropTarget(
    REGISTERED_COMPONENT,
    {
      canDrop: ({ root }: CanvasOuterProps, monitor: DropTargetMonitor) => {
        return true;
      },
      drop: (
        { root, dispatch, editor }: CanvasOuterProps,
        monitor: DropTargetMonitor
      ) => {
        const item = monitor.getItem() as RegisteredComponent;
        const offset = monitor.getClientOffset();
        const point = {
          left: offset.x,
          top: offset.y
        };

        dispatch(
          canvasDroppedRegisteredComponent(item, point, editor.activeFilePath)
        );
      },
      hover: () => {}
    },
    (connect, monitor) => {
      return {
        connectDropTarget: connect.dropTarget(),
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop()
      };
    }
  )
);

export const CanvasComponent = enhance(BaseCanvasComponent);
