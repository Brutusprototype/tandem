import * as React from "react";
import { Dispatch } from "redux";
import { Directory, memoize } from "tandem-common";
const { LayersPane } = require("./open-files/view.pc");
import { GutterComponent } from "../../../gutter";
import { RootState, EditorWindow } from "../../../../state";
import { FileNavigatorPaneComponent } from "./file-navigator";
import {
  getSyntheticNodeById,
  SyntheticDocument,
  getSyntheticVisibleNodeDocument,
  DependencyGraph
} from "../../../../../node_modules/paperclip";
import {
  InspectorNode,
  getSyntheticInspectorNode
} from "state/pc-inspector-tree";

type LeftGutterProps = {
  editorWindows: EditorWindow[];
  dispatch: Dispatch<any>;
  rootDirectory: Directory;
  root: RootState;
};

const BaseLeftGutterComponent = ({
  dispatch,
  rootDirectory,
  root
}: LeftGutterProps) => (
  <GutterComponent>
    <LayersPane
      selectedInspectorNodeIds={root.selectedInspectorNodeIds}
      hoveringInspectorNodeIds={gethoveringInspectorNodeIds(
        root.hoveringNodeIds,
        root.documents,
        root.sourceNodeInspector,
        root.graph
      )}
      sourceNodeInspector={root.sourceNodeInspector}
      dispatch={dispatch}
      graph={root.graph}
      documents={root.documents}
    />
    {/* <OpenFilesPaneComponent
      root={root}
      editorWindows={editorWindows}
      dispatch={dispatch}
    /> */}
    <FileNavigatorPaneComponent
      dispatch={dispatch}
      rootDirectory={rootDirectory}
      selectedFileNodeIds={root.selectedFileNodeIds}
      insertFileInfo={root.insertFileInfo}
    />
    {/* <ComponentsPaneComponent dispatch={dispatch} /> */}
  </GutterComponent>
);

const gethoveringInspectorNodeIds = memoize(
  (
    selectedNodeIds: string[],
    documents: SyntheticDocument[],
    rootInspectorNode: InspectorNode,
    graph: DependencyGraph
  ) => {
    return selectedNodeIds
      .map(nodeId => {
        return getSyntheticInspectorNode(
          getSyntheticNodeById(nodeId, documents),
          getSyntheticVisibleNodeDocument(nodeId, documents),
          rootInspectorNode,
          graph
        );
      })
      .filter(Boolean)
      .map(node => node.id);
  }
);

export const LeftGutterComponent = BaseLeftGutterComponent;
