import {
  IDd,
  moved,
  update,
  Bounds,
  Struct,
  removed,
  resized,
  updateIn,
  Translate,
  BaseEvent,
  zoomBounds,
  moveBounds,
  mergeBounds,
  mapImmutable,
  WrappedEvent,
  getBoundsSize,
  REMOVED,
  Removed,
  roundBounds,
  boundsFromRect,
  boundsIntersect,
  StructReference,
  scaleInnerBounds,
  keepBoundsCenter,
  getSmallestBounds,
  getStructReference,
  centerTransformZoom,
  pointIntersectsBounds,
  keepBoundsAspectRatio,
  arraySplice,
} from "aerial-common2";

import { clamp, merge } from "lodash";
import { getNestedObjectById, SlimBaseNode, getDocumentChecksum, SlimVMObjectType, getStyleOwnerScopeInfo } from "slim-dom";

import {
  Artboard,
  ARTBOARD,
  Workspace,
  updateArtboard,
  updateWorkspace,
  getWorkspaceById,
  getNodeArtboard,
  ApplicationState,
  removeArtboard,
  getArtboardById,
  updateArtboardSize,
  moveArtboardToBestPosition,
  getArtboardWorkspace,
  getStageTranslate,
  getDocumentBodyPreview,
  getArtboardBounds,
  ShortcutServiceState,
  getWorkspaceItemBounds,
  AVAILABLE_COMPONENT,
  updateWorkspaceStage,
  deselectNotFoundItems,
  getSelectedWorkspace,
  roundArtboardBounds,
  addWorkspaceSelection,
  setWorkspaceSelection,
  createApplicationState,
  showWorkspaceTextEditor,
  clearWorkspaceSelection,
  removeWorkspaceSelection,
  toggleWorkspaceSelection,
  getSyntheticNodeWorkspace,
  updateWorkspaceTextEditor,
  getWorkspaceSelectionBounds,
  getBoundedWorkspaceSelection,
  toggleWorkspaceTargetCSSSelector,
  getStageToolMouseNodeTargetReference,
} from "front-end/state";

import {
  NATIVE_COMPONENTS
} from "../constants";

import {
  StageWheel,
  StageMounted,
  ResizerMoved,
  CSS_TOGGLE_DECLARATION_EYE_CLICKED,
  CSSToggleDeclarationEyeClicked,
  TOGGLE_TOOLS_SHORTCUT_PRESSED,
  RESIZER_MOVED,
  ARTBOARD_LOADING,
  ArtboardLoading,
  STAGE_MOUNTED,
  ResizerMouseDown,
  BANNER_CLOSED,
  DND_STARTED,
  DND_ENDED,
  DND_HANDLED,
  FILE_REMOVED,
  FileRemoved,
  DNDEvent,
  ResizerPathMoved,
  STAGE_MOUSE_MOVED,
  EXCEPTION_CAUGHT,
  FILE_CONTENT_CHANGED,
  ExceptionCaught,
  LoadedSavedState,
  LOADED_SAVED_STATE,
  RESIZER_MOUSE_DOWN,
  BreadcrumbItemClicked,
  FileChanged,
  BreadcrumbItemMouseEnterLeave,
  BREADCRUMB_ITEM_CLICKED,
  STAGE_MOUSE_CLICKED,
  VISUAL_EDITOR_WHEEL,
  PromptedNewWindowUrl,
  TreeNodeLabelClicked,
  ARTBOARD_DOM_PATCHED,
  ArtboardDOMPatched,
  ArtboardPaneRowClicked,
  SelectorDoubleClicked,
  OPEN_ARTBOARDS_REQUESTED,
  OpenArtboardsRequested,
  DeleteShortcutPressed,
  StageWillWindowKeyDown,
  BREADCRUMB_ITEM_MOUSE_ENTER,
  ARTBOARD_SCROLL,
  WINDOW_RESIZED,
  WindowResized,
  StageResized,
  STAGE_RESIZED,
  ArtboardScroll,
  BREADCRUMB_ITEM_MOUSE_LEAVE,
  CSS_DECLARATION_TITLE_MOUSE_ENTER,
  CSS_DECLARATION_TITLE_MOUSE_LEAVE,
  CSSDeclarationTitleMouseLeaveEnter,
  DELETE_SHORCUT_PRESSED,
  PROMPTED_NEW_WINDOW_URL,
  KEYBOARD_SHORTCUT_ADDED,
  ArtboardSelectionShifted,
  ARTBOARD_SELECTION_SHIFTED,
  ESCAPE_SHORTCUT_PRESSED,
  CANVAS_MOTION_RESTED,
  NEXT_ARTBOARD_SHORTCUT_PRESSED,
  PREV_ARTBOARD_SHORTCUT_PRESSED,
  TOGGLE_TARGET_CSS_TARGET_SELECTOR_CLICKED,
  ToggleCSSTargetSelectorClicked,
  EMPTY_WINDOWS_URL_ADDED,
  RESIZER_STOPPED_MOVING,
  SELECTOR_DOUBLE_CLICKED,
  StageToolOverlayClicked,
  TREE_NODE_LABEL_CLICKED,
  ARTBOARD_PANE_ROW_CLICKED,
  RESIZER_PATH_MOUSE_MOVED,
  StageToolEditTextKeyDown,
  StageToolEditTextChanged,
  ZOOM_IN_SHORTCUT_PRESSED,
  WorkspaceSelectionDeleted,
  ZOOM_OUT_SHORTCUT_PRESSED,
  FULL_SCREEN_TARGET_DELETED,
  TOGGLE_LEFT_GUTTER_PRESSED,
  StageToolOverlayMouseMoved,
  TOGGLE_TEXT_EDITOR_PRESSED,
  WORKSPACE_DELETION_SELECTED,
  StageWillArtboardTitleClicked,
  TOGGLE_RIGHT_GUTTER_PRESSED,
  StageToolOverlayMousePanEnd,
  StageToolNodeOverlayClicked,
  FULL_SCREEN_SHORTCUT_PRESSED,
  StageToolNodeOverlayHoverOut,
  STAGE_TOOL_EDIT_TEXT_CHANGED,
  StageToolNodeOverlayHoverOver,
  STAGE_TOOL_EDIT_TEXT_KEY_DOWN,
  StageToolOverlayMousePanStart,
  API_COMPONENTS_LOADED,
  APIComponentsLoaded,
  STAGE_TOOL_OVERLAY_MOUSE_LEAVE,
  STAGE_TOOL_ARTBOARD_TITLE_CLICKED,
  STAGE_TOOL_OVERLAY_MOUSE_PAN_END,
  RESIZER_PATH_MOUSE_STOPPED_MOVING,
  ARTBOARD_FOCUSED,
  ARTBOARD_LOADED,
  ARTBOARD_PATCHED,
  ARTBOARD_RENDERED,
  ArtboardRendered,
  ArtboardCreated,
  ARTBOARD_CREATED,
  ArtboardLoaded,
  ArtboardPatched,
  ArtboardFocused,
  ARTBOARD_DOM_INFO_COMPUTED,
  ArtboardDOMInfoComputed,
  STAGE_TOOL_OVERLAY_MOUSE_PAN_START,
  STAGE_TOOL_WINDOW_BACKGROUND_CLICKED,
  COMPONENTS_PANE_COMPONENT_CLICKED,
  ComponentsPaneComponentClicked,
  CANVAS_ELEMENTS_COMPUTED_PROPS_CHANGED,
  FILE_NAVIGATOR_ADD_FILE_BUTTON_CLICKED,
  STAGE_TOOL_OVERLAY_MOUSE_DOUBLE_CLICKED,
  FILE_NAVIGATOR_ADD_FOLDER_BUTTON_CLICKED,
} from "front-end/actions";

import reduceReducers = require("reduce-reducers");

export const applicationReducer = (state: ApplicationState = createApplicationState(), event: BaseEvent) => {
  switch(event.type) {

    case LOADED_SAVED_STATE: {
      const { state: newState } = event as LoadedSavedState;
      state = merge({}, state, JSON.parse(JSON.stringify(newState)));
      break;
    }

    case TREE_NODE_LABEL_CLICKED: {
      const { node } = event as TreeNodeLabelClicked;
      state = updateWorkspace(state, state.selectedWorkspaceId, {
        selectedFileId: node.$id
      });
      break;
    }

    case TOGGLE_TARGET_CSS_TARGET_SELECTOR_CLICKED: {
      console.warn("TODO CSS ")
      // const { itemId, artboardId } = event as ToggleCSSTargetSelectorClicked;
      // const artboard = getArtboardById(artboardId, state);
      // const item = getNestedObjectById(itemId, artboard.document);
      // const workspace = getArtboardWorkspace(artboard.$id, state);;
      // state = toggleWorkspaceTargetCSSSelector(state, workspace.$id, item.source.uri, (item as any as SyntheticCSSStyleRule).selectorText);
      break;
    }
  }

  state = artboardReducer(state, event);
  state = stageReducer(state, event);
  state = cssInspectorReducer(state, event);
  state = workspaceReducer(state, event);
  state = artboardPaneReducer(state, event);
  state = componentsPaneReducer(state, event);
  state = shortcutReducer(state, event);
  state = apiReducer(state, event);
  state = dndReducer(state, event);

  return state;
};

const PANE_SENSITIVITY = process.platform === "win32" ? 0.1 : 1;
const ZOOM_SENSITIVITY = process.platform === "win32" ? 2500 : 250;
const MIN_ZOOM = 0.02;
const MAX_ZOOM = 6400 / 100;
const INITIAL_ZOOM_PADDING = 50;

const apiReducer = (state: ApplicationState, event: BaseEvent) => {
  switch(event.type) {
    case API_COMPONENTS_LOADED: {
      const { components } = event as APIComponentsLoaded;
      return updateWorkspace(state, state.selectedWorkspaceId, {
        availableComponents: [
          ...NATIVE_COMPONENTS,
          ...components
        ]
      });
    }
  }
  return state;
};

const workspaceReducer = (state: ApplicationState, event: BaseEvent) => {
  switch(event.type) {
    case EXCEPTION_CAUGHT: {
      const { error } = event as ExceptionCaught;
      return updateWorkspace(state, getSelectedWorkspace(state).$id, {
        uncaughtError: error
      });
    }
    case BANNER_CLOSED: {
      return updateWorkspace(state, getSelectedWorkspace(state).$id, {
        uncaughtError: null
      });
    }
  }
  return state;
};

const cssInspectorReducer = (state: ApplicationState, event: BaseEvent) => {
  switch(event.type) {
    case CSS_TOGGLE_DECLARATION_EYE_CLICKED: {
      const { artboardId, itemId, declarationName } = event as CSSToggleDeclarationEyeClicked;
      const workspace = getArtboardWorkspace(artboardId, state)
      const artboard = getArtboardById(artboardId, state);
      const disabledStyleDeclarations = workspace.disabledStyleDeclarations || {};
      const scopeInfo = getStyleOwnerScopeInfo(itemId, artboard.document);
      const scopeKey = scopeInfo.join("");
      const disabledItemDecls = disabledStyleDeclarations[scopeKey] || {};
      return updateWorkspace(state, workspace.$id, {
        disabledStyleDeclarations: {
          ...disabledStyleDeclarations,
          [scopeKey]: {
            ...(disabledItemDecls as any),
            [declarationName]: disabledItemDecls[declarationName] ? null : scopeInfo
          }
        }
      })
    }
  }
  return state;
}

const componentsPaneReducer = (state: ApplicationState, event: BaseEvent) => {
  switch(event.type) {
    case COMPONENTS_PANE_COMPONENT_CLICKED: {
      const { componentId } = event as ComponentsPaneComponentClicked;
      return setWorkspaceSelection(state, state.selectedWorkspaceId, getStructReference({$id: componentId, $type: AVAILABLE_COMPONENT}));
    }
  }
  return state;
}

const shortcutReducer = (state: ApplicationState, event: BaseEvent) => {
  switch(event.type) {
    case TOGGLE_LEFT_GUTTER_PRESSED: {
      const workspace = getSelectedWorkspace(state);
      return updateWorkspaceStage(state, workspace.$id, {
        showLeftGutter: !workspace.stage.showLeftGutter
      });
    }

    case ESCAPE_SHORTCUT_PRESSED: {
      const workspace = getSelectedWorkspace(state);
      return updateWorkspace(state, workspace.$id, {
        selectionRefs: []
      });
    }

    case PREV_ARTBOARD_SHORTCUT_PRESSED: {
      return state;
    }

    case FULL_SCREEN_TARGET_DELETED: {
      return unfullscreen(state);
    }

    case FULL_SCREEN_SHORTCUT_PRESSED: {
      const workspace = getSelectedWorkspace(state);
      const selection = workspace.selectionRefs[0];

      const artboardId = selection ? selection[0] === ARTBOARD ? selection[1] : getNodeArtboard(selection[1], state) && getNodeArtboard(selection[1], state).$id : null;

      if (artboardId && !workspace.stage.fullScreen) {
        const artboard = getArtboardById(artboardId, state);
        state = updateWorkspaceStage(state, workspace.$id, {
          smooth: true,
          fullScreen: {
            artboardId: artboardId,
            originalTranslate: workspace.stage.translate,
            originalArtboardBounds: artboard.bounds
          },
          translate: {
            zoom: 1,
            left: -artboard.bounds.left,
            top: -artboard.bounds.top
          }
        });
        const updatedWorkspace = getSelectedWorkspace(state);
        state = updateArtboard(state, artboardId, {
          bounds: {
            left: artboard.bounds.left,
            top: artboard.bounds.top,
            right: artboard.bounds.left + workspace.stage.container.getBoundingClientRect().width,
            bottom: artboard.bounds.top + workspace.stage.container.getBoundingClientRect().height
          }
        });
        return state;
      } else if (workspace.stage.fullScreen) {
        return unfullscreen(state);
      } else {
        return state;
      }
    }

    case CANVAS_MOTION_RESTED: {
      const workspace = getSelectedWorkspace(state);
      return updateWorkspaceStage(state, workspace.$id, {
        smooth: false
      });
    }

    case TOGGLE_TEXT_EDITOR_PRESSED: {
      const workspace = getSelectedWorkspace(state);
      return updateWorkspaceStage(state, workspace.$id, {
        showTextEditor: !workspace.stage.showTextEditor
      });
    }

    case TOGGLE_RIGHT_GUTTER_PRESSED: {
      const workspace = getSelectedWorkspace(state);
      return updateWorkspaceStage(state, workspace.$id, {
        showRightGutter: !workspace.stage.showRightGutter
      });
    }
  }
  return state;
}

const dndReducer = (state: ApplicationState, event: BaseEvent) => {
  switch(event.type) {
    case DND_STARTED: {
      const { ref }  = event as DNDEvent;
      return updateWorkspace(state, state.selectedWorkspaceId, {
        draggingRefs: [ref]
      })
    }
    case DND_HANDLED: {
      return updateWorkspace(state, state.selectedWorkspaceId, {
        draggingRefs: []
      });
    }
  }
  return state;
}

const stageReducer = (state: ApplicationState, event: BaseEvent) => {

  switch(event.type) {

    case TOGGLE_TOOLS_SHORTCUT_PRESSED: {
      const workspace = getSelectedWorkspace(state);
      return updateWorkspaceStage(state, workspace.$id, {
        showTools: workspace.stage.showTools == null ? false : !workspace.stage.showTools
      })
    }

    case STAGE_TOOL_EDIT_TEXT_KEY_DOWN: {
      const { sourceEvent, nodeId } = event as StageToolEditTextKeyDown;
      if (sourceEvent.key === "Escape") {
        // const workspace = getSyntheticNodeWorkspace(state, nodeId);
        // state = setWorkspaceSelection(state, workspace.$id, getStructReference(getNestedObjectById(nodeId, getNodeArtboard(nodeId, state).document)));
        // state = updateWorkspaceStage(state, workspace.$id, {
        //   secondarySelection: false
        // });
      }
      return state;
    }

    case ARTBOARD_FOCUSED: {
      const { artboardId } = event as ArtboardFocused;
      return selectAndCenterArtboard(state, getArtboardById(artboardId, state));
    }

    case STAGE_TOOL_OVERLAY_MOUSE_LEAVE: {
      const { sourceEvent } = event as StageToolOverlayMouseMoved;
      return updateWorkspace(state, state.selectedWorkspaceId, {
        hoveringRefs: []
      });
    }

    case CSS_DECLARATION_TITLE_MOUSE_ENTER: {
      const { artboardId, ruleId } = event as CSSDeclarationTitleMouseLeaveEnter;
      const artboard = getArtboardById(artboardId, state);

      // TODO
      return state;
      // const { selectorText }: SEnvCSSStyleRuleInterface = getNestedObjectById(ruleId, artboard.document);
      // return updateWorkspace(state, state.selectedWorkspaceId, {
      //   hoveringRefs: getMatchingElements(artboard, selectorText).map((element) => [
      //     element.$type,
      //     element.$id
      //   ]) as [[string, string]]
      // });
    }

    case CSS_DECLARATION_TITLE_MOUSE_LEAVE: {
      const { artboardId, ruleId } = event as CSSDeclarationTitleMouseLeaveEnter;
      return updateWorkspace(state, state.selectedWorkspaceId, {
        hoveringRefs: []
      });
    }

    case BREADCRUMB_ITEM_CLICKED: {
      const { artboardId, nodeId } = event as BreadcrumbItemClicked;
      const artboard = getArtboardById(artboardId, state);
      const node = getNestedObjectById(nodeId, artboard.document) as SlimBaseNode;
      const workspace = getArtboardWorkspace(artboard.$id, state);
      return setWorkspaceSelection(state, workspace.$id, [node.type, node.id]);
    }

    case BREADCRUMB_ITEM_MOUSE_ENTER: {
      const { artboardId, nodeId }  = event as BreadcrumbItemMouseEnterLeave;
      return updateWorkspace(state, state.selectedWorkspaceId, {
        hoveringRefs: [[SlimVMObjectType.ELEMENT, nodeId]]
      });
    }

    case BREADCRUMB_ITEM_MOUSE_LEAVE: {
      const { artboardId, nodeId }  = event as BreadcrumbItemMouseEnterLeave;
      return updateWorkspace(state, state.selectedWorkspaceId, {
        hoveringRefs: []
      });
    }

    case STAGE_MOUNTED: {
      const { element } = event as StageMounted;

      const { width = 400, height = 300 } = element.getBoundingClientRect() || {};
      const workspaceId = state.selectedWorkspaceId;
      const workspace = getSelectedWorkspace(state);

      state = updateWorkspaceStage(state, workspaceId, { container: element });

      // do not center if in full screen mode
      if (workspace.stage.fullScreen) {
        return updateArtboardSize(state, workspace.stage.fullScreen.artboardId, width, height);
      }

      return centerSelectedWorkspace(state);
    };

    case STAGE_TOOL_OVERLAY_MOUSE_PAN_START: {
      const { artboardId } = event as StageToolOverlayMousePanStart;
      const workspace = getArtboardWorkspace(artboardId, state);
      return updateWorkspaceStage(state, workspace.$id, { panning: true });
    }

    case STAGE_TOOL_OVERLAY_MOUSE_PAN_END: {
      const { artboardId } = event as StageToolOverlayMousePanEnd;
      const workspace = getArtboardWorkspace(artboardId, state)
      return updateWorkspaceStage(state, workspace.$id, { panning: false });
    }

    case STAGE_TOOL_OVERLAY_MOUSE_DOUBLE_CLICKED: {
      const { sourceEvent, artboardId } = event as StageToolNodeOverlayClicked;
      const workspace = getArtboardWorkspace(artboardId, state);
      const targetRef = getStageToolMouseNodeTargetReference(state, event as StageToolNodeOverlayClicked);
      if (!targetRef) return state;

      state = updateWorkspaceStage(state, workspace.$id, {
        secondarySelection: true
      });

      state = setWorkspaceSelection(state, workspace.$id, targetRef);

      return state;
    }

    case ARTBOARD_SELECTION_SHIFTED: {
      const { artboardId } = event as ArtboardSelectionShifted;
      return selectAndCenterArtboard(state, getArtboardById(artboardId, state));
    }

    case SELECTOR_DOUBLE_CLICKED: {
      const { sourceEvent, item } = event as SelectorDoubleClicked;
      const workspace = getSyntheticNodeWorkspace(state, item.$id);
      state = updateWorkspaceStage(state, workspace.$id, {
        secondarySelection: true
      });
      state = setWorkspaceSelection(state, workspace.$id, getStructReference(item));
      return state;
    }

    case ARTBOARD_SCROLL: {
      const { artboardId, scrollPosition } = event as ArtboardScroll;
      return updateArtboard(state, artboardId, {
        scrollPosition
      });
    }

    case WORKSPACE_DELETION_SELECTED: {
      const { workspaceId } = event as WorkspaceSelectionDeleted;
      state = clearWorkspaceSelection(state, workspaceId);
      return state;
    }

    case STAGE_TOOL_ARTBOARD_TITLE_CLICKED: {
      state = updateWorkspaceStageSmoothing(state);

      return handleArtboardSelectionFromAction(state, getStructReference(getArtboardById((event as ArtboardPaneRowClicked).artboardId, state)), event as ArtboardPaneRowClicked);
    }

    case STAGE_TOOL_WINDOW_BACKGROUND_CLICKED: {
      const workspace = getSelectedWorkspace(state);
      return clearWorkspaceSelection(state, workspace.$id);
    }
  }

  return state;
}

const unfullscreen = (state: ApplicationState, workspaceId: string = state.selectedWorkspaceId) => {
  const workspace = getWorkspaceById(state, workspaceId);
  const { originalArtboardBounds, artboardId } = workspace.stage.fullScreen;
  state = updateWorkspaceStage(state, workspace.$id, {
    smooth: true,
    fullScreen: undefined
  });

  state = updateWorkspaceStage(state, workspace.$id, {
    translate: workspace.stage.fullScreen.originalTranslate,
    smooth: true
  });

  state = updateArtboard(state, artboardId, {
    bounds: originalArtboardBounds
  });

  return state;
}

const selectAndCenterArtboard = (state: ApplicationState, artboard: Artboard) => {

  let workspace = getSelectedWorkspace(state);
  if (!workspace.stage.container) return state;

  const { width, height } = workspace.stage.container.getBoundingClientRect();

  state = centerStage(state, state.selectedWorkspaceId, artboard.bounds, true, workspace.stage.fullScreen ? workspace.stage.fullScreen.originalTranslate.zoom : true);

  // update translate
  workspace = getSelectedWorkspace(state);

  if (workspace.stage.fullScreen) {
    state = updateWorkspaceStage(state, workspace.$id, {
      smooth: true,
      fullScreen: {
        artboardId: artboard.$id,
        originalTranslate: workspace.stage.translate,
        originalArtboardBounds: artboard.bounds
      },
      translate: {
        zoom: 1,
        left: -artboard.bounds.left,
        top: -artboard.bounds.top
      }
    });
  }

  state = setWorkspaceSelection(state, workspace.$id, getStructReference(artboard));
  return state;
}

const artboardReducer = (state: ApplicationState, event: BaseEvent) => {
  switch(event.type) {
    case ARTBOARD_LOADED: {
      const { artboardId, dependencyUris, document, checksum, mount } = event as ArtboardLoaded;
      return updateArtboard(state, artboardId, {
        dependencyUris,
        document,
        loading: false,
        originalDocument: document,
        mount,
        checksum
      });
    }

    case ARTBOARD_LOADING: {
      const { artboardId } = event as ArtboardLoaded;
      state = updateArtboard(state, artboardId, { loading: true });
      state = deselectNotFoundItems(state);
      return state;
    }

    case FILE_CONTENT_CHANGED: {
      const { filePath } = event as FileChanged;

      const workspace = getSelectedWorkspace(state);
      for (const artboard of workspace.artboards) {
        if (artboard.dependencyUris && artboard.dependencyUris.indexOf(filePath) !== -1) {
          state = updateArtboard(state, artboard.$id, { loading: true });
        }
      }
      return state;
    }

    case ARTBOARD_PATCHED: {
      const { artboardId, document, checksum, nativeObjectMap } = event as ArtboardPatched;
      const artboard = getArtboardById(artboardId, state);
      state = updateArtboard(state, artboardId, {
        document,
        loading: false,
        nativeObjectMap,
        originalDocument: checksum ? document : artboard.originalDocument,
        checksum: checksum || artboard.checksum
      });
      state = deselectNotFoundItems(state);
      return state;
    }

    case ARTBOARD_DOM_PATCHED: {
      const { artboardId, nativeObjectMap } = event as ArtboardDOMPatched;
      state = updateArtboard(state, artboardId, {
        loading: false,
        nativeObjectMap
      });
      state = deselectNotFoundItems(state);
      return state;
    }

    case ARTBOARD_RENDERED: {
      const { artboardId, nativeObjectMap } = event as ArtboardRendered;
      return updateArtboard(state, artboardId, {
        nativeObjectMap,
        loading: false
      });
    }

    case STAGE_RESIZED: {
      const { width, height } = event as StageResized;
      return resizeFullScreenArtboard(state, width, height);
    }

    case REMOVED: {
      const { itemId, itemType } = event as Removed;
      if (itemType === ARTBOARD) {
        state = removeArtboard(itemId, state);
      }
      return state;
    }

    case ARTBOARD_DOM_INFO_COMPUTED: {
      const { artboardId, computedInfo } = event as ArtboardDOMInfoComputed;
      return updateArtboard(state, artboardId, {
        computedDOMInfo: computedInfo
      });
    }

    case ARTBOARD_CREATED: {
      let { artboard } = event as ArtboardCreated;
      if (!artboard.bounds || artboard.bounds.top === 0 && artboard.bounds.left === 0) {
        artboard = moveArtboardToBestPosition(artboard, state);
      }

      const workspace = getSelectedWorkspace(state);
      state = updateWorkspace(state, workspace.$id, {
        artboards: [...workspace.artboards, artboard]
      });

      state = roundArtboardBounds(artboard.$id, state);

      state = setWorkspaceSelection(state, workspace.$id, getStructReference(artboard));


      return state;
    }
  }
  return state;
}

const centerSelectedWorkspace = (state: ApplicationState, smooth: boolean = false) => {
  const workspace = getWorkspaceById(state, state.selectedWorkspaceId);
  const innerBounds = getArtboardBounds(workspace);

  // no windows loaded
  if (innerBounds.left + innerBounds.right + innerBounds.top + innerBounds.bottom === 0) {
    console.warn(`Stage mounted before windows have been loaded`);
    return state;
  }

  return centerStage(state, workspace.$id, innerBounds, smooth, true);
}

const centerStage = (state: ApplicationState, workspaceId: string, innerBounds: Bounds, smooth?: boolean, zoomOrZoomToFit?: boolean|number) => {
  const workspace = getWorkspaceById(state, workspaceId);
  const { stage: { container, translate }} = workspace;
  if (!container) return state;

  const { width, height } = container.getBoundingClientRect();

  const innerSize = getBoundsSize(innerBounds);

  const centered = {
    left: -innerBounds.left + width / 2 - (innerSize.width) / 2,
    top: -innerBounds.top + height / 2 - (innerSize.height) / 2,
  };

  const scale = typeof zoomOrZoomToFit === "boolean" ? Math.min(
    (width - INITIAL_ZOOM_PADDING) / innerSize.width,
    (height - INITIAL_ZOOM_PADDING) / innerSize.height
  ) : typeof zoomOrZoomToFit === "number" ? zoomOrZoomToFit : translate.zoom;

  return updateWorkspaceStage(state, workspaceId, {
    smooth,
    translate: centerTransformZoom({
      ...centered,
      zoom: 1
    }, { left: 0, top: 0, right: width, bottom: height }, scale)
  });
};

const handleArtboardSelectionFromAction = <T extends { sourceEvent: React.MouseEvent<any> }>(state: ApplicationState, ref: StructReference, event: T) => {
  const { sourceEvent } = event;
  const workspace = getSelectedWorkspace(state);
  return setWorkspaceSelection(state, workspace.$id, ref);
}

const resizeFullScreenArtboard = (state: ApplicationState, width: number, height: number) => {
  const workspace = getSelectedWorkspace(state);
  if (workspace.stage.fullScreen && workspace.stage.container) {

    // TODO - do not all getBoundingClientRect here. Dimensions need to be
    return updateArtboardSize(state, workspace.stage.fullScreen.artboardId, width, height);
  }
  return state;
}

const normalizeZoom = (zoom) => {
  return (zoom < 1 ? 1 / Math.round(1 / zoom) : Math.round(zoom));
};

const artboardPaneReducer = (state: ApplicationState, event: BaseEvent) => {
  switch (event.type) {
    case ARTBOARD_PANE_ROW_CLICKED: {
      const { artboardId } = event as ArtboardPaneRowClicked;
      return selectAndCenterArtboard(state, getArtboardById(artboardId, state));
    }
  }
  return state;
};

const updateWorkspaceStageSmoothing = (state: ApplicationState, workspace?: Workspace) => {
  if (!workspace) workspace = getSelectedWorkspace(state);
  if (!workspace.stage.fullScreen && workspace.stage.smooth) {
    return updateWorkspaceStage(state, workspace.$id, {
      smooth: false
    });
  }
  return state;
};
