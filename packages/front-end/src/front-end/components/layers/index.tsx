import "./index.scss";
import * as React from "react";
import * as cx from "classnames";
import { RootState } from "../../state";
import { SyntheticWindow, SyntheticBrowser, SyntheticDocument, SyntheticObjectType, EDITOR_NAMESPACE } from "../../../paperclip";
import { compose, pure, withHandlers, withState, withProps } from "recompose"
import { getAttribute, EMPTY_ARRAY, getNestedTreeNodeById, TreeNode } from "../../../common";
import { Dispatch } from "redux";
import {
  DropTarget,
  DragSource,
	DropTargetCollector,
} from "react-dnd";

export type TreeLayerDroppedNodeActionCreator = (child: TreeNode, targetNode: TreeNode, offset: 0|-1|1) => any;
export type TreeLayerMouseActionCreator = (node: TreeNode) => any;

type AttributeInfo = {
  name: string;
  namespace?: string;
};

type TreeLayerOptions = {
  actionCreators: {
    treeLayerDroppedNode?: TreeLayerDroppedNodeActionCreator,
    treeLayerMouseOut?: TreeLayerMouseActionCreator,
    treeLayerMouseOver?: TreeLayerMouseActionCreator,
    treeLayerClick?: TreeLayerMouseActionCreator,
    treeLayerDoubleClick?: TreeLayerMouseActionCreator,
    treeLayerExpandToggleClick?: TreeLayerMouseActionCreator
  }
  reorganizable?: boolean;
  dragType: string,
  depthOffset?: number,
  attributeOptions?: {
    nodeLabelAttr?: AttributeInfo,
    expandAttr?: AttributeInfo,
  }
};

const DEFAULT_NODE_EXPAND_ATTRIBUTE = {
  name: "expanded",
  namespace: EDITOR_NAMESPACE
};

const DEFAULT_NODE_LABEL_ATTRIBUTE = {
  name: "label",
  namespace: EDITOR_NAMESPACE
};

export const createTreeLayerComponents = ({
  attributeOptions: {
    nodeLabelAttr = DEFAULT_NODE_LABEL_ATTRIBUTE,
    expandAttr = DEFAULT_NODE_EXPAND_ATTRIBUTE,
  } = {},
  depthOffset = 30, actionCreators: { treeLayerDroppedNode, treeLayerMouseOver, treeLayerClick, treeLayerDoubleClick, treeLayerMouseOut, treeLayerExpandToggleClick }, dragType, reorganizable = true }: TreeLayerOptions) => {


  const DRAG_TYPE = dragType;
  const DEPTH_PADDING = 8;
  const DEPTH_OFFSET = depthOffset;

  type InsertOuterProps = {
    depth: number;
    node: TreeNode;
    dispatch: Dispatch<any>;
  };

  type InsertInnerProps = {
    isOver: boolean;
    connectDropTarget: any;
  } & InsertOuterProps;

  const BaseInsertComponent = ({ depth, isOver: hovering, connectDropTarget }: InsertInnerProps) => {
    const style = {
      width: `calc(100% - ${DEPTH_OFFSET + depth * DEPTH_PADDING}px)`
    };
    return connectDropTarget(<div style={style} className={cx("insert-line", { hovering })}>
    </div>);
  };

  const withNodeDropTarget = (offset: 0 | -1 | 1) => DropTarget(DRAG_TYPE, {
    canDrop: ({ node }: { node: TreeNode, dispatch: Dispatch<any> }, monitor) => {
      const draggingNode = (monitor.getItem() as TreeNode);
      return node.id !== draggingNode.id && getNestedTreeNodeById(node.id, draggingNode) == null;
    },
    drop: ({ dispatch, node }, monitor) => {
      dispatch(treeLayerDroppedNode(monitor.getItem() as TreeNode, node, offset));
    }
  }, (connect, monitor) => {
    return {
      connectDropTarget: connect.dropTarget(),
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }
  });

  const InsertBeforeComponent = compose<InsertInnerProps, InsertOuterProps>(
    pure,
    withNodeDropTarget(-1),
  )(BaseInsertComponent);

  const InsertAfterComponent = compose<InsertInnerProps, InsertOuterProps>(
    pure,
    withNodeDropTarget(1),
  )(BaseInsertComponent);


  type TreeNodeLayerLabelOuterProps = {
    node: TreeNode;
    depth: number;
    selected: boolean;
    hovering: boolean;
    expanded: boolean;
    dispatch: Dispatch<any>;
  };

  type TreeNodeLayerLabelInnerProps = {
    connectDropTarget?: any;
    connectDragSource?: any;
    isOver: boolean;
    canDrop: boolean;
    onLabelMouseOver: (event: React.MouseEvent<any>) => any;
    onLabelMouseOut: (event: React.MouseEvent<any>) => any;
    onLabelClick: (event: React.MouseEvent<any>) => any;
    onLabelDoubleClick: (event: React.MouseEvent<any>) => any;
    onExpandToggleButtonClick: (event: React.MouseEvent<any>) => any;
  } & TreeNodeLayerLabelOuterProps;

  const BaseTreeNodeLayerLabelComponent = ({ connectDropTarget, connectDragSource, node, canDrop, isOver, depth, expanded, selected, hovering, onLabelClick, onLabelMouseOut, onLabelMouseOver, onLabelDoubleClick, onExpandToggleButtonClick }: TreeNodeLayerLabelInnerProps) => {
    const labelStyle = {
      paddingLeft: DEPTH_OFFSET + depth * DEPTH_PADDING
    };
    return connectDropTarget(connectDragSource(<div style={labelStyle} className={cx("label", { selected, hovering: hovering || (isOver && canDrop) })} onMouseOver={onLabelMouseOver} onMouseOut={onLabelMouseOut} onClick={onLabelClick} onDoubleClick={onLabelDoubleClick}>
      <span onClick={onExpandToggleButtonClick}>
        { node.children.length ? expanded ? <i className="ion-arrow-down-b" /> : <i className="ion-arrow-right-b" /> : null }
      </span>
      { getAttribute(node, nodeLabelAttr.name, nodeLabelAttr.namespace) || "Untitled" }
    </div>));
  };

  const TreeNodeLayerLabelComponent = compose<TreeNodeLayerLabelInnerProps, TreeNodeLayerLabelOuterProps>(
    pure,
    withHandlers({
      onLabelMouseOver: ({ dispatch, document, node }) => () => {
        treeLayerMouseOver && dispatch(treeLayerMouseOver(node));
      },
      onLabelMouseOut: ({ dispatch, document, node }) => () => {
        treeLayerMouseOut && dispatch(treeLayerMouseOut(node));
      },
      onLabelClick: ({ dispatch, document, node }) => () => {
        treeLayerClick && dispatch(treeLayerClick(node));
      },
      onLabelDoubleClick: ({ dispatch, document, node }) => () => {
        treeLayerDoubleClick && dispatch(treeLayerDoubleClick(node));
      },
      onExpandToggleButtonClick: ({ dispatch, document, node }) => (event: React.MouseEvent<any>) => {
        treeLayerExpandToggleClick && dispatch(treeLayerExpandToggleClick(node));
        event.stopPropagation();
      }
    }),
    DragSource(DRAG_TYPE, {
      beginDrag({ node }: TreeNodeLayerLabelOuterProps) {
        return node;
      }
    }, (connect, monitor) => ({
      connectDragSource: connect.dragSource(),
      connectDragPreview: connect.dragPreview(),
      isDragging: monitor.isDragging(),
    })),
    withNodeDropTarget(0),
  )(BaseTreeNodeLayerLabelComponent);

  type TreeNodeLayerOuterProps = {
    isRoot?: boolean;
    node: TreeNode;
    depth: number;
    dispatch: Dispatch<any>;
    hoveringNodeIds: string[];
    selectedNodeIds: string[];
  };

  type TreeNodeLayerInnerProps = {
  } & TreeNodeLayerOuterProps;

  const BaseTreeNodeLayerComponent = ({ isRoot, hoveringNodeIds, selectedNodeIds, node, depth, dispatch }: TreeNodeLayerInnerProps) => {

    const selected = selectedNodeIds.indexOf(node.id) !== -1;
    const hovering = hoveringNodeIds.indexOf(node.id) !== -1;
    const expanded = getAttribute(node, expandAttr.name, expandAttr.namespace);

    return <div className="m-tree-node-layer">
      { isRoot || !reorganizable ? null : <InsertBeforeComponent node={node} depth={depth} dispatch={dispatch} /> }
      <TreeNodeLayerLabelComponent node={node} selected={selected} hovering={hovering} dispatch={dispatch} depth={depth} expanded={expanded} />
      <div className="children">
        {
          !node.children.length || expanded ? node.children.map(child => {
            return <TreeNodeLayerComponent hoveringNodeIds={hoveringNodeIds} selectedNodeIds={selectedNodeIds} key={child.id} node={child as TreeNode} depth={depth + 1} dispatch={dispatch} />
          }) : null
        }
      </div>
      { isRoot || !reorganizable ? null : <InsertAfterComponent node={node} depth={depth} dispatch={dispatch}  /> }
    </div>;
  };

  const TreeNodeLayerComponent = compose<TreeNodeLayerInnerProps, TreeNodeLayerOuterProps>(
    pure
  )(BaseTreeNodeLayerComponent);

  const RootNodeLayerComponent = compose<TreeNodeLayerOuterProps, TreeNodeLayerOuterProps>(
    pure,
    withProps({ isRoot: true })
  )(BaseTreeNodeLayerComponent);

  return { RootNodeLayerComponent, TreeNodeLayerComponent};
}

