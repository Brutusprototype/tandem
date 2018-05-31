import { Action } from "redux";
import * as path from "path";
import {
  CanvasToolArtboardTitleClicked,
  NEW_FILE_ADDED,
  PC_LAYER_EDIT_LABEL_BLUR,
  CANVAS_TOOL_ARTBOARD_TITLE_CLICKED,
  PROJECT_LOADED,
  PC_LAYER_DOUBLE_CLICK,
  ProjectLoaded,
  SYNTHETIC_WINDOW_OPENED,
  CanvasToolOverlayMouseMoved,
  PROJECT_DIRECTORY_LOADED,
  ProjectDirectoryLoaded,
  FILE_NAVIGATOR_ITEM_CLICKED,
  FileNavigatorItemClicked,
  DOCUMENT_RENDERED,
  DocumentRendered,
  CANVAS_WHEEL,
  CANVAS_MOUSE_MOVED,
  CANVAS_MOUNTED,
  CANVAS_MOUSE_CLICKED,
  WrappedEvent,
  CanvasToolOverlayClicked,
  RESIZER_MOUSE_DOWN,
  ResizerMouseDown,
  ResizerMoved,
  RESIZER_MOVED,
  RESIZER_PATH_MOUSE_STOPPED_MOVING,
  RESIZER_STOPPED_MOVING,
  ResizerPathStoppedMoving,
  RESIZER_PATH_MOUSE_MOVED,
  ResizerPathMoved,
  SHORTCUT_ESCAPE_KEY_DOWN,
  INSERT_TOOL_FINISHED,
  InsertToolFinished,
  SHORTCUT_DELETE_KEY_DOWN,
  CANVAS_TOOL_WINDOW_BACKGROUND_CLICKED,
  SYNTHETIC_NODES_PASTED,
  SyntheticNodesPasted,
  FILE_NAVIGATOR_ITEM_DOUBLE_CLICKED,
  OPEN_FILE_ITEM_CLICKED,
  OPEN_FILE_ITEM_CLOSE_CLICKED,
  OpenFilesItemClick,
  SAVED_FILE,
  SavedFile,
  SAVED_ALL_FILES,
  RAW_CSS_TEXT_CHANGED,
  RawCSSTextChanged,
  PC_LAYER_MOUSE_OVER,
  PC_LAYER_MOUSE_OUT,
  PC_LAYER_CLICK,
  PC_LAYER_EXPAND_TOGGLE_CLICK,
  TreeLayerLabelChanged,
  TreeLayerClick,
  TreeLayerDroppedNode,
  TreeLayerExpandToggleClick,
  TreeLayerMouseOut,
  FILE_NAVIGATOR_TOGGLE_DIRECTORY_CLICKED,
  TreeLayerMouseOver,
  PC_LAYER_DROPPED_NODE,
  FILE_NAVIGATOR_NEW_FILE_CLICKED,
  FILE_NAVIGATOR_NEW_DIRECTORY_CLICKED,
  NewFileAdded,
  FILE_NAVIGATOR_DROPPED_ITEM,
  FileNavigatorDroppedItem,
  SHORTCUT_UNDO_KEY_DOWN,
  SHORTCUT_REDO_KEY_DOWN,
  SLOT_TOGGLE_CLICK,
  PC_LAYER_LABEL_CHANGED,
  NATIVE_NODE_TYPE_CHANGED,
  TEXT_VALUE_CHANGED,
  TextValueChanged,
  NativeNodeTypeChanged,
  SHORTCUT_QUICK_SEARCH_KEY_DOWN,
  QUICK_SEARCH_ITEM_CLICKED,
  QuickSearchItemClicked,
  QUICK_SEARCH_BACKGROUND_CLICK,
  NEW_VARIANT_NAME_ENTERED,
  NewVariantNameEntered,
  COMPONENT_VARIANT_NAME_DEFAULT_TOGGLE_CLICK,
  ComponentVariantNameDefaultToggleClick,
  COMPONENT_VARIANT_REMOVED,
  COMPONENT_VARIANT_NAME_CHANGED,
  ComponentVariantNameChanged,
  COMPONENT_VARIANT_NAME_CLICKED,
  ComponentVariantNameClicked,
  ELEMENT_VARIANT_TOGGLED,
  ElementVariantToggled,
  EDITOR_TAB_CLICKED,
  EditorTabClicked,
  CanvasWheel,
  SHORTCUT_ZOOM_IN_KEY_DOWN,
  SHORTCUT_ZOOM_OUT_KEY_DOWN,
  CanvasMounted,
  CANVAS_DROPPED_REGISTERED_COMPONENT,
  CanvasDroppedRegisteredComponent,
  CANVAS_DRAGGED_OVER,
  SHORTCUT_CONVERT_TO_COMPONENT_KEY_DOWN,
  SHORTCUT_T_KEY_DOWN,
  SHORTCUT_R_KEY_DOWN
} from "../actions";
import {
  RootState,
  setActiveFilePath,
  updateRootState,
  updateEditorCanvas,
  getCanvasMouseTargetNodeId,
  setSelectedSyntheticNodeIds,
  getSelectionBounds,
  getBoundedSelection,
  ToolType,
  setTool,
  persistRootState,
  getOpenFile,
  addOpenFile,
  upsertOpenFile,
  removeTemporaryOpenFiles,
  setNextOpenFile,
  updateOpenFile,
  deselectRootProjectFiles,
  setHoveringSyntheticNodeIds,
  setRootStateSyntheticNodeExpanded,
  setSelectedFileNodeIds,
  InsertFileType,
  setInsertFile,
  undo,
  redo,
  openSyntheticNodeOriginFile,
  setRootStateSyntheticNodeLabelEditing,
  getEditorWithActiveFileUri,
  openEditorFileUri,
  openSecondEditor,
  getActiveEditor,
  getEditorWithFileUri,
  updateEditor,
  getSyntheticWindowBounds,
  centerEditorCanvas,
  getCanvasMouseTargetNodeIdFromPoint,
  isSelectionMovable,
  SyntheticNodeMetadataKeys
} from "../state";
import {
  PCSourceTagNames,
  PCVisibleNode,
  PCTextNode,
  PCElement,
  paperclipReducer,
  PC_DEPENDENCY_LOADED,
  PCDependencyLoaded,
  PC_SYNTHETIC_FRAME_RENDERED,
  SyntheticElement,
  createPCElement,
  createPCTextNode,
  PCFrame,
  getSyntheticSourceFrame,
  getSyntheticNodeBounds,
  getSyntheticNodeFrame,
  getSyntheticSourceNode,
  createPCFrame,
  getSyntheticNodeById,
  SyntheticNode,
  queueLoadDependencyUri,
  getPCNodeDependency,
  updateSyntheticNodePosition,
  updateSyntheticFrameBounds,
  updateSyntheticNodeBounds,
  persistInsertNode,
  persistChangeLabel,
  removeSyntheticNode,
  persistSyntheticNodeBounds,
  persistRemoveSyntheticNode,
  getSyntheticNodeSourceDependency,
  persistConvertNodeToComponent,
  PCModule,
  persistInsertClips,
  getPCNodeModule
} from "paperclip";
import {
  getTreeNodePath,
  getTreeNodeFromPath,
  File,
  EMPTY_OBJECT,
  TreeNode,
  StructReference,
  roundBounds,
  scaleInnerBounds,
  moveBounds,
  keepBoundsAspectRatio,
  keepBoundsCenter,
  Bounded,
  Struct,
  Bounds,
  getBoundsSize,
  shiftBounds,
  flipPoint,
  diffArray,
  isDirectory,
  updateNestedNode,
  FileAttributeNames,
  Directory,
  getNestedTreeNodeById,
  isFile,
  arraySplice,
  getParentTreeNode,
  appendChildNode,
  removeNestedTreeNode,
  resizeBounds,
  updateNestedNodeTrail,
  boundsFromRect,
  centerTransformZoom,
  Translate,
  zoomBounds,
  getBoundsPoint,
  TreeMoveOffset,
  shiftPoint,
  Point,
  zoomPoint,
  cloneTreeNode,
  createTreeNode,
  FSItemNamespaces,
  FSItemTagNames,
  FSItem,
  getFileFromUri,
  createFile
} from "tandem-common";
import { difference, pull, clamp, merge } from "lodash";
import { select } from "redux-saga/effects";

const DEFAULT_RECT_COLOR = "#CCC";
const INSERT_TEXT_OFFSET = {
  left: -5,
  top: -10
};

const PANE_SENSITIVITY = process.platform === "win32" ? 0.1 : 1;
const ZOOM_SENSITIVITY = process.platform === "win32" ? 2500 : 250;
const MIN_ZOOM = 0.02;
const MAX_ZOOM = 6400 / 100;
const INITIAL_ZOOM_PADDING = 50;

export const rootReducer = (state: RootState, action: Action): RootState => {
  state = paperclipReducer(state, action);
  state = canvasReducer(state, action);
  state = shortcutReducer(state, action);
  state = clipboardReducer(state, action);

  switch (action.type) {
    case PROJECT_DIRECTORY_LOADED: {
      const { directory } = action as ProjectDirectoryLoaded;
      return updateRootState({ projectDirectory: directory }, state);
    }
    case FILE_NAVIGATOR_ITEM_CLICKED: {
      const { node } = action as FileNavigatorItemClicked;
      const uri = node.uri;
      state = setSelectedFileNodeIds(state, node.id);
      state = setFileExpanded(node, true, state);

      if (!isDirectory(node)) {
        state = setActiveFilePath(uri, state);
        return state;
      }

      return state;
    }
    case QUICK_SEARCH_ITEM_CLICKED: {
      const { file } = action as QuickSearchItemClicked;
      const uri = file.uri;
      state = queueLoadDependencyUri(uri, state);
      state = setSelectedFileNodeIds(state, file.id);
      state = setActiveFilePath(uri, state);
      state = upsertOpenFile(uri, false, state);
      state = updateRootState({ showQuickSearch: false }, state);
      return state;
    }
    case QUICK_SEARCH_BACKGROUND_CLICK: {
      return (state = updateRootState({ showQuickSearch: false }, state));
    }
    case FILE_NAVIGATOR_TOGGLE_DIRECTORY_CLICKED: {
      const { node } = action as FileNavigatorItemClicked;
      state = setFileExpanded(node, !node.expanded, state);
      return state;
    }
    case FILE_NAVIGATOR_ITEM_DOUBLE_CLICKED: {
      const { node } = action as FileNavigatorItemClicked;
      const uri = node.uri;
      const file = getFileFromUri(uri, state.projectDirectory);
      if (isFile(file)) {
        state = upsertOpenFile(uri, false, state);
        state = openEditorFileUri(uri, state);
      }

      return state;
    }
    case FILE_NAVIGATOR_NEW_FILE_CLICKED: {
      return setInsertFile(InsertFileType.FILE, state);
    }
    case FILE_NAVIGATOR_NEW_DIRECTORY_CLICKED: {
      return setInsertFile(InsertFileType.DIRECTORY, state);
    }

    case CANVAS_MOUNTED: {
      const { fileUri, element } = action as CanvasMounted;

      const { width = 400, height = 300 } =
        element.getBoundingClientRect() || {};

      state = updateEditorCanvas(
        {
          container: element
        },
        fileUri,
        state
      );

      return centerEditorCanvas(state, fileUri);
    }

    case FILE_NAVIGATOR_DROPPED_ITEM: {
      const { node, targetNode } = action as FileNavigatorDroppedItem;
      const parent: Directory = getParentTreeNode(
        node.id,
        state.projectDirectory
      );
      const parentUri = parent.uri;
      const nodeUri = node.uri;
      state = updateRootState(
        {
          projectDirectory: updateNestedNode(
            parent,
            state.projectDirectory,
            parent => removeNestedTreeNode(node, parent)
          )
        },
        state
      );

      const targetDir: Directory =
        targetNode.name !== FSItemTagNames.FILE
          ? targetNode
          : getParentTreeNode(targetNode.id, state.projectDirectory);
      const targetUri = targetDir.uri;
      state = updateRootState(
        {
          projectDirectory: updateNestedNode(
            targetDir,
            state.projectDirectory,
            targetNode => {
              return appendChildNode(
                {
                  ...node,
                  uri: nodeUri.replace(parentUri, targetUri)
                } as FSItem,
                targetNode
              );
            }
          )
        },
        state
      );

      return state;
    }
    case NEW_FILE_ADDED: {
      const { directoryId, basename, fileType } = action as NewFileAdded;
      const directory: Directory = getNestedTreeNodeById(
        directoryId,
        state.projectDirectory
      );
      let uri = directory.uri + basename;
      if (fileType === "directory") {
        uri += "/";
      }
      state = updateRootState(
        {
          insertFileInfo: null,
          projectDirectory: updateNestedNode(
            directory,
            state.projectDirectory,
            dir => {
              return {
                ...dir,
                children: [...dir.children, createFile(uri)]
              };
            }
          )
        },
        state
      );
      return state;
    }
    case OPEN_FILE_ITEM_CLICKED: {
      const { uri, sourceEvent } = action as OpenFilesItemClick;
      if (getEditorWithActiveFileUri(uri, state)) {
        return state;
      }
      state = setNextOpenFile(
        removeTemporaryOpenFiles(
          sourceEvent.metaKey
            ? openSecondEditor(uri, state)
            : openEditorFileUri(uri, state)
        )
      );
      return state;
    }
    case SAVED_FILE: {
      const { uri } = action as SavedFile;
      return updateOpenFile({ newContent: null }, uri, state);
    }
    case SAVED_ALL_FILES: {
      return updateRootState(
        {
          openFiles: state.openFiles.map(openFile => ({
            ...openFile,
            newContent: null
          }))
        },
        state
      );
    }
    case ELEMENT_VARIANT_TOGGLED: {
      // const { newVariants } = action as ElementVariantToggled;
      // const sourceNode = getSyntheticSourceNode(
      //   state.selectedNodeIds[0],
      //   state.paperclip
      // );
      // state = persistRootState(
      //   browser =>
      //     persistSetElementVariants(
      //       newVariants,
      //       sourceNode.id,
      //       state.selectedComponentVariantName,
      //       browser
      //     ),
      //   state
      // );
      return state;
    }
    case NEW_VARIANT_NAME_ENTERED: {
      // const { value } = action as NewVariantNameEntered;
      // const sourceNode = getSyntheticSourceNode(
      //   state.selectedNodeIds[0],
      //   state.paperclip
      // ) as PCComponentNode;
      // state = persistRootState(
      //   browser => persistInsertNewComponentVariant(value, sourceNode, browser),
      //   state
      // );
      return state;
    }
    case COMPONENT_VARIANT_NAME_DEFAULT_TOGGLE_CLICK: {
      const { name, value } = action as ComponentVariantNameDefaultToggleClick;
      // const sourceComponent = getSyntheticNodeSourceComponent(
      //   state.selectedNodeIds[0],
      //   state.paperclip
      // );
      // state = persistRootState(
      //   browser =>
      //     persistComponentVariantChanged(
      //       { [PCSourceNamespaces.CORE]: { isDefault: value } },
      //       name,
      //       sourceComponent.id,
      //       browser
      //     ),
      //   state
      // );
      return state;
    }
    case COMPONENT_VARIANT_REMOVED: {
      const { name, value } = action as ComponentVariantNameDefaultToggleClick;
      // const sourceComponent = getSyntheticNodeSourceComponent(
      //   state.selectedNodeIds[0],
      //   state.paperclip
      // );
      // state = persistRootState(
      //   browser =>
      //     persistRemoveComponentVariant(name, sourceComponent.id, browser),
      //   state
      // );
      return state;
    }
    case COMPONENT_VARIANT_NAME_CLICKED: {
      const { name } = action as ComponentVariantNameClicked;
      state = updateRootState({ selectedComponentVariantName: name }, state);
      return state;
    }
    case COMPONENT_VARIANT_NAME_CHANGED: {
      const { oldName, newName } = action as ComponentVariantNameChanged;
      // const sourceComponentNode = getSyntheticNodeSourceComponent(
      //   state.selectedNodeIds[0],
      //   state.paperclip
      // );
      // state = persistRootState(
      //   browser =>
      //     persistComponentVariantChanged(
      //       {
      //         [PCSourceNamespaces.CORE]: { name: newName }
      //       },
      //       oldName,
      //       sourceComponentNode.id,
      //       browser
      //     ),
      //   state
      // );
      return state;
    }
    case PC_LAYER_MOUSE_OVER: {
      const { node } = action as TreeLayerMouseOver;
      state = setHoveringSyntheticNodeIds(state, node.id);
      return state;
    }
    case PC_LAYER_DOUBLE_CLICK: {
      const { node } = action as TreeLayerClick;
      state = setRootStateSyntheticNodeLabelEditing(node.id, true, state);
      return state;
    }
    case PC_LAYER_EDIT_LABEL_BLUR: {
      const { node } = action as TreeLayerClick;
      state = setRootStateSyntheticNodeLabelEditing(node.id, false, state);
      return state;
    }
    case PC_LAYER_LABEL_CHANGED: {
      const { label, node } = action as TreeLayerLabelChanged;

      state = setRootStateSyntheticNodeLabelEditing(node.id, false, state);
      state = persistRootState(
        browser => persistChangeLabel(label, node as SyntheticNode, browser),
        state
      );
      return state;
    }
    case PC_LAYER_DROPPED_NODE: {
      const { node, targetNode, offset } = action as TreeLayerDroppedNode;
      // const oldDocument = getSyntheticNodeDocument(
      //   targetNode.id,
      //   state.paperclip
      // );
      // const targetNodeWindow = getSyntheticNodeWindow(
      //   targetNode.id,
      //   state.paperclip
      // );
      // state = persistRootState(
      //   browser =>
      //     persistMoveSyntheticNode(
      //       node as SyntheticNode,
      //       targetNode.id,
      //       offset,
      //       browser
      //     ),
      //   state
      // );

      // state = setActiveFilePath(targetNodeWindow.location, state);

      // deselect until fixed -- exception thrown in various conditions
      // where synthetic node no longer exists.
      state = setSelectedSyntheticNodeIds(state);
      return state;
    }
    case PC_LAYER_MOUSE_OUT: {
      const { node } = action as TreeLayerMouseOut;
      state = setHoveringSyntheticNodeIds(state);
      return state;
    }
    case PC_LAYER_CLICK: {
      const { node, sourceEvent } = action as TreeLayerClick;
      if (sourceEvent.altKey) {
        // state = openSyntheticNodeOriginFile(node.id, state);
      } else {
        const dep = getSyntheticNodeSourceDependency(
          node as SyntheticNode,
          state.graph
        );
        state = setActiveFilePath(dep.uri, state);
        state = setSelectedSyntheticNodeIds(
          state,
          ...(sourceEvent.shiftKey
            ? [...state.selectedNodeIds, node.id]
            : [node.id])
        );
      }
      return state;
    }
    case PC_LAYER_EXPAND_TOGGLE_CLICK: {
      const { node } = action as TreeLayerExpandToggleClick;
      state = setRootStateSyntheticNodeExpanded(
        node.id,
        !(node as SyntheticNode).metadata[SyntheticNodeMetadataKeys.EXPANDED],
        state
      );
      return state;
    }
    case OPEN_FILE_ITEM_CLOSE_CLICKED: {
      // TODO - flag confirm remove state
      const { uri } = action as OpenFilesItemClick;
      return setNextOpenFile(
        updateRootState(
          {
            openFiles: state.openFiles.filter(openFile => openFile.uri !== uri)
          },
          state
        )
      );
    }
    case EDITOR_TAB_CLICKED: {
      const { uri } = action as EditorTabClicked;
      return openEditorFileUri(uri, state);
    }
    case PC_DEPENDENCY_LOADED: {
      const { uri, graph } = action as PCDependencyLoaded;
      state = centerEditorCanvas(state, uri);
      return state;
    }
  }
  return state;
};

export const canvasReducer = (state: RootState, action: Action) => {
  switch (action.type) {
    case RESIZER_MOVED: {
      const { point: newPoint } = action as ResizerMoved;
      state = updateEditorCanvas(
        {
          movingOrResizing: true
        },
        state.activeEditorFilePath,
        state
      );

      if (isSelectionMovable(state)) {
        const selectionBounds = getSelectionBounds(state);
        const nodeId = state.selectedNodeIds[0];

        const frame = getSyntheticNodeFrame(nodeId, state.syntheticFrames);
        let movedBounds = moveBounds(selectionBounds, newPoint);

        for (const nodeId of state.selectedNodeIds) {
          const itemBounds = getSyntheticNodeBounds(
            nodeId,
            state.syntheticFrames
          );
          const newBounds = roundBounds(
            scaleInnerBounds(itemBounds, selectionBounds, movedBounds)
          );

          state = updateSyntheticNodePosition(
            newBounds,
            getSyntheticNodeById(nodeId, state.syntheticFrames),
            state
          );
        }
      }

      return state;
    }
    case RESIZER_MOUSE_DOWN: {
      const { sourceEvent } = action as ResizerMouseDown;
      if (sourceEvent.metaKey) {
        // state = openSyntheticNodeOriginFile(state.selectedNodeIds[0], state);
      }
      return state;
    }
    case RESIZER_STOPPED_MOVING: {
      const { point } = action as ResizerMoved;
      const oldGraph = state.graph;

      if (isSelectionMovable(state)) {
        const selectionBounds = getSelectionBounds(state);
        state = persistRootState(state => {
          return state.selectedNodeIds.reduce((state, nodeId) => {
            return persistSyntheticNodeBounds(
              getSyntheticNodeById(nodeId, state.syntheticFrames),
              state
            );
          }, state);
        }, state);
      }

      state = updateEditorCanvas(
        {
          movingOrResizing: false
        },
        state.activeEditorFilePath,
        state
      );
      return state;
    }

    case CANVAS_WHEEL: {
      const {
        metaKey,
        ctrlKey,
        deltaX,
        deltaY,
        canvasHeight,
        canvasWidth
      } = action as CanvasWheel;
      const editor = getActiveEditor(state);

      let translate = editor.canvas.translate;

      if (metaKey || ctrlKey) {
        translate = centerTransformZoom(
          translate,
          boundsFromRect({
            width: canvasWidth,
            height: canvasHeight
          }),
          clamp(
            translate.zoom + translate.zoom * deltaY / ZOOM_SENSITIVITY,
            MIN_ZOOM,
            MAX_ZOOM
          ),
          editor.canvas.mousePosition
        );
      } else {
        translate = {
          ...translate,
          left: translate.left - deltaX,
          top: translate.top - deltaY
        };
      }

      return updateEditorCanvas(
        { translate, smooth: false },
        editor.activeFilePath,
        state
      );
    }

    case CANVAS_DROPPED_REGISTERED_COMPONENT: {
      let {
        item,
        point,
        editorUri
      } = action as CanvasDroppedRegisteredComponent;
      const targetNodeId = getCanvasMouseTargetNodeIdFromPoint(state, point);

      let sourceNode: PCVisibleNode = cloneTreeNode(item.template);

      let targetSourceId: string;

      if (targetNodeId) {
        targetSourceId = getSyntheticSourceNode(
          getSyntheticNodeById(targetNodeId, state.syntheticFrames),
          state.graph
        ).id;
      } else {
        targetSourceId = state.graph[editorUri].content.id;
        point = normalizePoint(
          getEditorWithFileUri(editorUri, state).canvas.translate,
          point
        );
        sourceNode = {
          ...sourceNode,
          style: {
            ...sourceNode.style,
            left: point.left,
            top: point.top,
            width: 200,
            height: 200
          }
        };
      }

      return state;
      // return persistRootState(
      //   browser =>
      //     persistInsertNode(
      //       sourceNode,
      //       targetSourceId,
      //       TreeMoveOffset.APPEND,
      //       browser
      //     ),
      //   state
      // );
    }

    case SHORTCUT_ZOOM_IN_KEY_DOWN: {
      const editor = getActiveEditor(state);
      state = setCanvasZoom(
        normalizeZoom(editor.canvas.translate.zoom) * 2,
        false,
        editor.activeFilePath,
        state
      );
      return state;
    }

    case SHORTCUT_ZOOM_OUT_KEY_DOWN: {
      const editor = getActiveEditor(state);
      state = setCanvasZoom(
        normalizeZoom(editor.canvas.translate.zoom) / 2,
        false,
        editor.activeFilePath,
        state
      );
      return state;
    }

    case CANVAS_MOUSE_MOVED: {
      const {
        sourceEvent: { pageX, pageY }
      } = action as WrappedEvent<React.MouseEvent<any>>;
      state = updateEditorCanvas(
        { mousePosition: { left: pageX, top: pageY } },
        state.activeEditorFilePath,
        state
      );

      let targetNodeId: string;
      const editor = getActiveEditor(state);

      if (!editor.canvas.movingOrResizing) {
        targetNodeId = getCanvasMouseTargetNodeId(
          state,
          action as CanvasToolOverlayMouseMoved
        );
      }

      state = updateRootState(
        {
          hoveringNodeIds: targetNodeId ? [targetNodeId] : []
        },
        state
      );

      return state;
    }

    case CANVAS_DRAGGED_OVER: {
      const {
        sourceEvent: { pageX, pageY }
      } = action as WrappedEvent<React.MouseEvent<any>>;
      state = updateEditorCanvas(
        { mousePosition: { left: pageX, top: pageY } },
        state.activeEditorFilePath,
        state
      );

      // TODO - in the future, we'll probably want to be able to highlight hovered nodes as the user is moving an element around to indicate where
      // they can drop the element.

      let targetNodeId: string;
      const editor = getActiveEditor(state);

      targetNodeId = getCanvasMouseTargetNodeId(
        state,
        action as CanvasToolOverlayMouseMoved,
        node => node.name !== PCSourceTagNames.TEXT
      );
      const node = getSyntheticNodeById(targetNodeId, state.syntheticFrames);

      state = updateRootState(
        {
          hoveringNodeIds: targetNodeId ? [targetNodeId] : []
        },
        state
      );

      return state;
    }

    // TODO
    case CANVAS_MOUSE_CLICKED: {
      if (state.toolType != null) {
        return state;
      }

      state = deselectRootProjectFiles(state);

      const { sourceEvent } = action as CanvasToolOverlayClicked;
      if (/textarea|input/i.test((sourceEvent.target as Element).nodeName)) {
        return state;
      }

      // alt key opens up a new link
      const altKey = sourceEvent.altKey;
      const metaKey = sourceEvent.metaKey;

      const editor = getActiveEditor(state);

      // do not allow selection while window is panning (scrolling)
      if (editor.canvas.panning || editor.canvas.movingOrResizing) return state;

      const targetNodeId = getCanvasMouseTargetNodeId(
        state,
        action as CanvasToolOverlayMouseMoved
      );

      if (!targetNodeId) {
        return state;
      }

      // if (altKey) {
      //   state = openSyntheticNodeOriginFile(targetNodeId, state);
      //   return state;
      // }

      if (!altKey) {
        state = handleArtboardSelectionFromAction(
          state,
          targetNodeId,
          action as CanvasToolOverlayMouseMoved
        );
        state = updateEditorCanvas(
          {
            secondarySelection: false
          },
          editor.activeFilePath,
          state
        );
        return state;
      }
      return state;
    }
    case RESIZER_PATH_MOUSE_MOVED: {
      state = updateEditorCanvas(
        {
          movingOrResizing: true
        },
        state.activeEditorFilePath,
        state
      );

      // TODO - possibly use BoundsStruct instead of Bounds since there are cases where bounds prop doesn't exist
      const newBounds = getResizeActionBounds(action as ResizerPathMoved);
      for (const nodeId of getBoundedSelection(state)) {
        state = updateSyntheticNodeBounds(
          getNewSyntheticNodeBounds(newBounds, nodeId, state),
          getSyntheticNodeById(nodeId, state.syntheticFrames),
          state
        );
      }

      return state;
    }
    case RESIZER_PATH_MOUSE_STOPPED_MOVING: {
      state = updateEditorCanvas(
        {
          movingOrResizing: false
        },
        state.activeEditorFilePath,
        state
      );

      // TODO - possibly use BoundsStruct instead of Bounds since there are cases where bounds prop doesn't exist
      const newBounds = getResizeActionBounds(
        action as ResizerPathStoppedMoving
      );

      state = persistRootState(state => {
        return state.selectedNodeIds.reduce(
          (state, nodeId) =>
            persistSyntheticNodeBounds(
              getSyntheticNodeById(nodeId, state.syntheticFrames),
              state
            ),
          state
        );
      }, state);

      return state;
    }
    case RAW_CSS_TEXT_CHANGED: {
      const { value: cssText } = action as RawCSSTextChanged;
      // state = persistRootState(browser => {
      //   return state.selectedNodeIds.reduce(
      //     (browserState, nodeId) =>
      //       persistRawCSSText(
      //         cssText,
      //         nodeId,
      //         state.selectedComponentVariantName,
      //         browserState
      //       ),
      //     state.paperclip
      //   );
      // }, state);
      return state;
    }
    case SLOT_TOGGLE_CLICK: {
      // state = persistRootState(browser => {
      //   return persistToggleSlotContainer(
      //     getSyntheticSourceNode(state.selectedNodeIds[0], state.paperclip).id,
      //     browser
      //   );
      // }, state);
      return state;
    }
    case NATIVE_NODE_TYPE_CHANGED: {
      const { nativeType } = action as NativeNodeTypeChanged;
      // state = persistRootState(browser => {
      //   return persistChangeNodeType(
      //     nativeType,
      //     getSyntheticSourceNode(
      //       state.selectedNodeIds[0],
      //       state.paperclip
      //     ) as PCElement,
      //     browser
      //   );
      // }, state);
      return state;
    }
    case TEXT_VALUE_CHANGED: {
      const { value } = action as TextValueChanged;
      // state = persistRootState(browser => {
      //   return persistTextValue(
      //     value,
      //     getSyntheticSourceNode(
      //       state.selectedNodeIds[0],
      //       state.paperclip
      //     ) as PCTextNode,
      //     browser
      //   );
      // }, state);
      return state;
    }
    case CANVAS_TOOL_ARTBOARD_TITLE_CLICKED: {
      const {
        documentId,
        sourceEvent
      } = action as CanvasToolArtboardTitleClicked;
      const frame = state.syntheticFrames[documentId];
      state = updateEditorCanvas(
        { smooth: false },
        getPCNodeDependency(frame.root.source.nodeId, state.graph).uri,
        state
      );
      return handleArtboardSelectionFromAction(
        state,
        frame.root.id,
        action as CanvasToolArtboardTitleClicked
      );
    }
    case CANVAS_TOOL_WINDOW_BACKGROUND_CLICKED: {
      return setSelectedSyntheticNodeIds(state);
    }
    case INSERT_TOOL_FINISHED: {
      let { point, fileUri } = action as InsertToolFinished;
      const editor = getEditorWithActiveFileUri(fileUri, state);

      const toolType = state.toolType;
      state = setTool(null, state);

      switch (toolType) {
        case ToolType.ELEMENT: {
          return persistInsertNodeFromPoint(
            createPCElement("div"),
            fileUri,
            point,
            state
          );
        }

        case ToolType.TEXT: {
          return persistInsertNodeFromPoint(
            createPCTextNode("Click to edit"),
            fileUri,
            point,
            state
          );
        }
      }
    }
  }

  return state;
};

const INSERT_ARTBOARD_WIDTH = 100;
const INSERT_ARTBOARD_HEIGHT = 100;

const persistInsertNodeFromPoint = (
  node: PCVisibleNode | PCFrame,
  fileUri: string,
  point: Point,
  state: RootState
) => {
  const targetNodeId = getCanvasMouseTargetNodeIdFromPoint(state, point);
  const targetNode =
    targetNodeId && getSyntheticNodeById(targetNodeId, state.syntheticFrames);

  if (!targetNode) {
    const newPoint = shiftPoint(
      normalizePoint(
        getEditorWithFileUri(fileUri, state).canvas.translate,
        point
      ),
      {
        left: -(INSERT_ARTBOARD_WIDTH / 2),
        top: -(INSERT_ARTBOARD_HEIGHT / 2)
      }
    );

    node = createPCFrame([node as PCVisibleNode], {
      ...newPoint,
      right: newPoint.left + INSERT_ARTBOARD_WIDTH,
      bottom: newPoint.top + INSERT_ARTBOARD_HEIGHT
    });
  }

  state = persistRootState(browser => {
    return persistInsertNode(
      node,
      targetNode
        ? getSyntheticSourceNode(targetNode, state.graph)
        : state.graph[fileUri].content,
      TreeMoveOffset.APPEND,
      state
    );
  }, state);
  // state = setSelectedSyntheticNodeIds(
  //   state,
  //   ...getInsertedWindowElementIds(
  //     oldWindow,
  //     document && document.id,
  //     state.paperclip
  //   )
  // );
  return state;
};

const setFileExpanded = (node: FSItem, value: boolean, state: RootState) => {
  state = updateRootState(
    {
      projectDirectory: updateNestedNode(
        node,
        state.projectDirectory,
        (node: FSItem) => ({
          ...node,
          expanded: value
        })
      )
    },
    state
  );
  return state;
};

const getNewSyntheticNodeBounds = (
  newBounds: Bounds,
  nodeId: string,
  state: RootState
) => {
  const currentBounds = getSelectionBounds(state);
  const innerBounds = getSyntheticNodeBounds(nodeId, state.syntheticFrames);
  return scaleInnerBounds(innerBounds, currentBounds, newBounds);
};

const getResizeActionBounds = (action: ResizerPathMoved | ResizerMoved) => {
  let {
    anchor,
    originalBounds,
    newBounds,
    sourceEvent
  } = action as ResizerPathMoved;

  const keepAspectRatio = sourceEvent.shiftKey;
  const keepCenter = sourceEvent.altKey;

  if (keepCenter) {
    // TODO - need to test. this might not work
    newBounds = keepBoundsCenter(newBounds, originalBounds, anchor);
  }

  if (keepAspectRatio) {
    newBounds = keepBoundsAspectRatio(
      newBounds,
      originalBounds,
      anchor,
      keepCenter ? { left: 0.5, top: 0.5 } : anchor
    );
  }

  return newBounds;
};

const isInputSelected = (state: RootState) => {
  // ick -- this needs to be moved into a saga
  return (
    document.activeElement &&
    /textarea|input|button/i.test(document.activeElement.tagName)
  );
};

const shortcutReducer = (state: RootState, action: Action): RootState => {
  switch (action.type) {
    case SHORTCUT_QUICK_SEARCH_KEY_DOWN: {
      return isInputSelected(state)
        ? state
        : updateRootState(
            {
              showQuickSearch: !state.showQuickSearch
            },
            state
          );
    }
    case SHORTCUT_UNDO_KEY_DOWN: {
      return undo(state);
    }
    case SHORTCUT_REDO_KEY_DOWN: {
      return redo(state);
    }
    case SHORTCUT_T_KEY_DOWN: {
      return isInputSelected(state) ? state : setTool(ToolType.TEXT, state);
    }
    case SHORTCUT_R_KEY_DOWN: {
      return isInputSelected(state) ? state : setTool(ToolType.ELEMENT, state);
    }
    case SHORTCUT_CONVERT_TO_COMPONENT_KEY_DOWN: {
      // TODO - should be able to conver all selected nodes to components
      if (state.selectedNodeIds.length > 1) {
        return state;
      }

      state = persistRootState(
        state =>
          persistConvertNodeToComponent(
            getSyntheticNodeById(
              state.selectedNodeIds[0],
              state.syntheticFrames
            ),
            state
          ),
        state
      );
      state = setSelectedSyntheticNodeIds(state);
      return state;
    }
    case SHORTCUT_ESCAPE_KEY_DOWN: {
      if (isInputSelected(state)) {
        return state;
      }
      if (state.toolType) {
        return setTool(null, state);
      } else {
        state = setSelectedSyntheticNodeIds(state);
        state = setSelectedFileNodeIds(state);
        state = updateRootState({ insertFileInfo: null }, state);
        return state;
      }
    }
    case SHORTCUT_DELETE_KEY_DOWN: {
      if (isInputSelected(state)) {
        return state;
      }

      return persistRootState(state => {
        state = state.selectedNodeIds.reduce((state, nodeId) => {
          return persistRemoveSyntheticNode(
            getSyntheticNodeById(nodeId, state.syntheticFrames),
            state
          );
        }, state);

        state = setSelectedSyntheticNodeIds(state);
        return state;
      }, state);
    }
  }

  return state;
};

const clipboardReducer = (state: RootState, action: Action) => {
  switch (action.type) {
    case SYNTHETIC_NODES_PASTED: {
      const { clips } = action as SyntheticNodesPasted;

      let targetNode: PCVisibleNode | PCModule;

      if (state.selectedNodeIds.length) {
        const nodeId = state.selectedNodeIds[0];
        const node = getSyntheticNodeById(nodeId, state.syntheticFrames);
        targetNode = getSyntheticSourceNode(node, state.graph);
        targetNode = getParentTreeNode(
          targetNode.id,
          getPCNodeModule(targetNode.id, state.graph)
        );
      } else {
        targetNode = state.graph[state.activeEditorFilePath].content;
      }

      state = persistRootState(
        state => persistInsertClips(clips, targetNode, state),
        state
      );

      return state;
    }
  }

  return state;
};

const isDroppableNode = (node: SyntheticNode) => {
  return (
    node.name !== "text" &&
    !/input/.test(String((node as SyntheticElement).name))
  );
};

const handleArtboardSelectionFromAction = <
  T extends { sourceEvent: React.MouseEvent<any> }
>(
  state: RootState,
  nodeId: string,
  event: T
) => {
  const { sourceEvent } = event;
  state = setRootStateSyntheticNodeExpanded(nodeId, true, state);
  return setSelectedSyntheticNodeIds(
    state,
    ...(event.sourceEvent.shiftKey
      ? [...state.selectedNodeIds, nodeId]
      : [nodeId])
  );
};

// const resizeFullScreenArtboard = (state: RootState, width: number, height: number) => {
//   const workspace = getSelectedWorkspace(state);
//   if (workspace.stage.fullScreen && workspace.stage.container) {

//     // TODO - do not all getBoundingClientRect here. Dimensions need to be
//     return updateArtboardSize(state, workspace.stage.fullScreen.documentId, width, height);
//   }
//   return state;
// }

const setCanvasZoom = (
  zoom: number,
  smooth: boolean = true,
  uri: string,
  state: RootState
) => {
  const editor = getEditorWithFileUri(uri, state);

  return updateEditorCanvas(
    {
      translate: centerTransformZoom(
        editor.canvas.translate,
        editor.canvas.container.getBoundingClientRect(),
        clamp(zoom, MIN_ZOOM, MAX_ZOOM),
        editor.canvas.mousePosition
      )
    },
    uri,
    state
  );
};

const normalizeBounds = (translate: Translate, bounds: Bounds) => {
  return zoomBounds(
    shiftBounds(bounds, {
      left: -translate.left,
      top: -translate.top
    }),
    1 / translate.zoom
  );
};

const normalizePoint = (translate: Translate, point: Point) => {
  return zoomPoint(
    shiftPoint(point, {
      left: -translate.left,
      top: -translate.top
    }),
    1 / translate.zoom
  );
};

const normalizeZoom = zoom => {
  return zoom < 1 ? 1 / Math.round(1 / zoom) : Math.round(zoom);
};
