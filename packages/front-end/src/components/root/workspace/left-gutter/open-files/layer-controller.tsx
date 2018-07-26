import * as React from "react";
import { last } from "lodash";
import * as path from "path";
import { FocusComponent } from "../../../../focus";
import * as cx from "classnames";
import { compose, pure, withHandlers, withState } from "recompose";
import { DragSource } from "react-dnd";
import { withNodeDropTarget } from "./dnd-controller";
const { BeforeDropZone, AfterDropZone } = require("./drop-zones.pc");
import {
  SyntheticNode,
  PCSourceTagNames,
  getPCNode,
  DependencyGraph,
  PCVisibleNode,
  getPCNodeDependency,
  SyntheticDocument,
  PCComponent,
  getPCNodeContentNode,
  PCModule,
  extendsComponent
} from "paperclip";
import {
  InspectorNode,
  InspectorTreeNodeName,
  getInspectorSyntheticNode
} from "../../../../../state/pc-inspector-tree";
import { Dispatch } from "redux";
import {
  sourceInspectorLayerClicked,
  sourceInspectorLayerArrowClicked,
  sourceInspectorLayerLabelChanged
} from "../../../../../actions";
import {
  containsNestedTreeNodeById,
  TreeMoveOffset
} from "../../../../../../node_modules/tandem-common";
import { getContentNode } from "./utils";

export type LayerControllerOuterProps = {
  depth?: number;
  graph: DependencyGraph;
  dispatch: Dispatch<any>;
  inShadow?: boolean;
  contentNode: InspectorNode;
  selectedInspectorNodeIds: string[];
  hoveringInspectorNodeIds: string[];
  document: SyntheticDocument;
  inspectorNode: InspectorNode;
  syntheticNode: SyntheticNode;
  editingLabel: boolean;
};

type LayerControllerInnerProps = {
  isOver: boolean;
  canDrop: boolean;
  onLabelClick: () => any;
  connectDragSource?: any;
  connectDropTarget?: any;
  onLabelDoubleClick: () => any;
  onArrowButtonClick: () => any;
  onLabelInputKeyDown: () => any;
} & LayerControllerOuterProps;

const DRAG_TYPE = "INSPECTOR_NODE";

const LAYER_PADDING = 16;

export default Base => {
  let EnhancedLayer;

  const enhance = compose<LayerControllerOuterProps, LayerControllerOuterProps>(
    pure,
    withState("editingLabel", "setEditingLabel", false),
    withHandlers({
      onLabelClick: ({ dispatch, inspectorNode }) => (
        event: React.MouseEvent<any>
      ) => {
        dispatch(sourceInspectorLayerClicked(inspectorNode, event));
      },
      onArrowButtonClick: ({ dispatch, inspectorNode }) => (
        event: React.MouseEvent<any>
      ) => {
        event.stopPropagation();
        dispatch(sourceInspectorLayerArrowClicked(inspectorNode, event));
      },
      onLabelDoubleClick: ({ inspectorNode, setEditingLabel }) => () => {
        if (inspectorNode.name === InspectorTreeNodeName.SOURCE_REP) {
          setEditingLabel(true);
        }
      },
      onLabelInputKeyDown: ({ dispatch, inspectorNode, setEditingLabel }) => (
        event: React.KeyboardEvent<any>
      ) => {
        if (event.key === "Enter") {
          const label = String((event.target as any).value || "").trim();
          setEditingLabel(false);
          dispatch(
            sourceInspectorLayerLabelChanged(inspectorNode, label, event)
          );
        }
      }
    }),
    withNodeDropTarget(TreeMoveOffset.PREPEND),
    DragSource(
      DRAG_TYPE,
      {
        beginDrag({ inspectorNode }: LayerControllerOuterProps) {
          return inspectorNode;
        },
        canDrag({
          inspectorNode,
          contentNode,
          graph
        }: LayerControllerOuterProps) {
          contentNode = getContentNode(inspectorNode, contentNode, graph);

          const contentSourceNode =
            contentNode && getPCNode(contentNode.assocSourceNodeId, graph);
          const sourceNode = getPCNode(inspectorNode.assocSourceNodeId, graph);
          return (
            contentSourceNode &&
            containsNestedTreeNodeById(sourceNode.id, contentSourceNode)
          );
        }
      },
      (connect, monitor) => ({
        connectDragSource: connect.dragSource(),
        connectDragPreview: connect.dragPreview(),
        isDragging: monitor.isDragging()
      })
    ),
    Base => ({
      graph,
      depth = 1,
      dispatch,
      document,
      onLabelClick,
      editingLabel,
      selectedInspectorNodeIds,
      hoveringInspectorNodeIds,
      isOver,
      canDrop,
      contentNode,
      inspectorNode,
      onArrowButtonClick,
      onLabelDoubleClick,
      onLabelInputKeyDown,
      connectDragSource,
      connectDropTarget,
      inShadow
    }: LayerControllerInnerProps) => {
      const expanded = inspectorNode.expanded;
      const assocSourceNode = getPCNode(inspectorNode.assocSourceNodeId, graph);
      const isSourceRep =
        inspectorNode.name === InspectorTreeNodeName.SOURCE_REP;
      inShadow =
        inShadow || inspectorNode.name === InspectorTreeNodeName.SHADOW;
      let children;

      const isSelected =
        selectedInspectorNodeIds.indexOf(inspectorNode.id) !== -1;
      const isHovering =
        hoveringInspectorNodeIds.indexOf(inspectorNode.id) !== -1 ||
        (canDrop && isOver);
      const isSlot =
        inspectorNode.name === InspectorTreeNodeName.CONTENT ||
        assocSourceNode.name === PCSourceTagNames.SLOT;
      if (expanded) {
        const childDepth = depth + 1;
        children = inspectorNode.children.map(child => {
          return (
            <EnhancedLayer
              inShadow={inShadow}
              contentNode={getContentNode(inspectorNode, contentNode, graph)}
              selectedInspectorNodeIds={selectedInspectorNodeIds}
              hoveringInspectorNodeIds={hoveringInspectorNodeIds}
              document={document}
              key={child.id}
              depth={childDepth}
              dispatch={dispatch}
              inspectorNode={child}
              graph={graph}
            />
          );
        });
      }

      let label = (assocSourceNode as PCVisibleNode).label;

      if (!label) {
        if (assocSourceNode.name === PCSourceTagNames.MODULE) {
          const dependency = getPCNodeDependency(
            inspectorNode.assocSourceNodeId,
            graph
          );
          label = path.basename(dependency.uri);
        } else if (
          assocSourceNode.name === PCSourceTagNames.COMPONENT_INSTANCE
        ) {
          const component = getPCNode(assocSourceNode.is, graph);
          label = (component as PCComponent).label;
        } else if (assocSourceNode.name === PCSourceTagNames.ELEMENT) {
          label = assocSourceNode.is || "Element";
        } else if (assocSourceNode.name === PCSourceTagNames.CONTENT) {
          const targetSourceNode = getPCNode(
            assocSourceNode.slotId,
            graph
          ) as PCVisibleNode;
          label = targetSourceNode.label || "Slot";
        } else if (assocSourceNode.name === PCSourceTagNames.SLOT) {
          label = assocSourceNode.name || "Slot";
        }
      }

      const dropZoneStyle = {
        width: `calc(100% - ${depth * LAYER_PADDING}px)`
      };

      return (
        <span>
          <BeforeDropZone
            style={dropZoneStyle}
            dispatch={dispatch}
            inspectorNode={inspectorNode}
            contentNode={contentNode}
            graph={graph}
          />
          <FocusComponent focus={editingLabel}>
            {connectDropTarget(
              connectDragSource(
                <div>
                  <Base
                    onClick={onLabelClick}
                    onDoubleClick={onLabelDoubleClick}
                    labelInputProps={{ onKeyDown: onLabelInputKeyDown }}
                    variant={cx({
                      editingLabel: editingLabel,
                      file:
                        isSourceRep &&
                        assocSourceNode.name === PCSourceTagNames.MODULE,
                      component:
                        isSourceRep &&
                        assocSourceNode.name === PCSourceTagNames.COMPONENT,
                      instance:
                        isSourceRep &&
                        assocSourceNode.name ===
                          PCSourceTagNames.COMPONENT_INSTANCE,
                      element:
                        isSourceRep &&
                        assocSourceNode.name === PCSourceTagNames.ELEMENT,
                      text:
                        isSourceRep &&
                        assocSourceNode.name === PCSourceTagNames.TEXT,
                      expanded,
                      selected: isSelected,
                      slot: isSlot,
                      alt: inspectorNode.alt && !isSelected,
                      content:
                        inspectorNode.name === InspectorTreeNodeName.CONTENT,
                      shadow:
                        inspectorNode.name === InspectorTreeNodeName.SHADOW,
                      hover: isHovering,
                      inShadow: !isSelected && inShadow
                    })}
                    arrowProps={{
                      onClick: onArrowButtonClick
                    }}
                    labelProps={{
                      text: label
                    }}
                    style={{ paddingLeft: depth * LAYER_PADDING }}
                  />
                </div>
              )
            )}
          </FocusComponent>
          <AfterDropZone
            style={dropZoneStyle}
            dispatch={dispatch}
            inspectorNode={inspectorNode}
            contentNode={contentNode}
            graph={graph}
          />
          {children}
        </span>
      );
    }
  );

  return (EnhancedLayer = enhance(Base));
};
