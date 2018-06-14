/**
 * tools overlay like measurements, resizers, etc
 */

import "./index.scss";
import * as React from "react";
import { Dispatch } from "redux";
import { pure, compose } from "recompose";
import {
  RootState,
  Editor,
  getActiveFrames
} from "../../../../../../../../state";
import { SelectableToolsComponent } from "./selectables";
import { NodeOverlaysTool } from "./document-overlay";
import { SelectionCanvasTool } from "./selection";
const { Frames } = require("./frames-view.pc");
import { InsertLayer } from "./insert-layer";

export type ToolsLayerComponent = {
  editor: Editor;
  root: RootState;
  zoom: number;
  dispatch: Dispatch<any>;
};

const BaseToolsLayerComponent = ({
  editor,
  root,
  zoom,
  dispatch
}: ToolsLayerComponent) => {
  return (
    <div className="m-tools-layer">
      <InsertLayer
        editor={editor}
        toolType={root.toolType}
        dispatch={dispatch}
      />
      <Frames
        root={root}
        translate={editor.canvas.translate}
        dispatch={dispatch}
        editor={editor}
      />
      <NodeOverlaysTool
        root={root}
        zoom={zoom}
        dispatch={dispatch}
        editor={editor}
      />
      {/* {activeWindow && (
        <SelectableToolsComponent documents={activeWindow.documents} />
      )} */}
      <SelectionCanvasTool
        root={root}
        dispatch={dispatch}
        zoom={zoom}
        editor={editor}
      />
    </div>
  );
};

export const ToolsLayerComponent = compose<
  ToolsLayerComponent,
  ToolsLayerComponent
>(pure)(BaseToolsLayerComponent);
