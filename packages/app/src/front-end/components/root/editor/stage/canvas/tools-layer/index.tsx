/**
 * tools overlay like measurements, resizers, etc
 */

import "./index.scss";
import * as React from "react";
import { Dispatch } from "redux";
import { SyntheticWindow } from "paperclip";
import { RootState, getActiveWindow } from "front-end/state";
import { SelectableToolsComponent } from "./selectables";
import { NodeOverlaysTool } from "./document-overlay";
import { SelectionCanvasTool } from "./selection";
import { DocumentsCanvasTool } from "./documents";

export type ToolsLayerComponent = {
  root: RootState;
  zoom: number;
  dispatch: Dispatch<any>
};

const BaseToolsLayerComponent = ({ root, zoom, dispatch }: ToolsLayerComponent) => {
  const activeWindow = getActiveWindow(root);
  return <div className="m-tools-layer">
    <DocumentsCanvasTool root={root} translate={root.canvas.translate} dispatch={dispatch} />
    <NodeOverlaysTool root={root} zoom={zoom} dispatch={dispatch} />
    { activeWindow && <SelectableToolsComponent documents={activeWindow.documents} /> }
    <SelectionCanvasTool root={root} dispatch={dispatch} zoom={zoom} />
  </div>;
};

export const ToolsLayerComponent = BaseToolsLayerComponent;