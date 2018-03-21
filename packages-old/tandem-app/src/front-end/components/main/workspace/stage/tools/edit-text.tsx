import "./edit-text.scss";
import * as React from "react";
import {findDOMNode} from "react-dom";
import { Workspace } from "front-end/state";
import { compose, pure, lifecycle, withState } from "recompose";
import { Dispatcher, getBoundsSize ,wrapEventToDispatch } from "aerial-common2";
import { stageToolEditTextChanged, stageToolEditTextBlur, stageToolEditTextKeyDown } from "front-end/actions";

export type EditTextToolOuterProps = {
  zoom: number;
  workspace: Workspace;
  dispatch: Dispatcher<any>;
}

export type EditTextToolInnerProps = {
  textarea: HTMLTextAreaElement;
  setTextarea: (v: any) => any;
} & EditTextToolOuterProps;

const TEXT_PADDING = 10

export const EditTextToolBase = ({ workspace, dispatch, setTextarea, zoom }: EditTextToolInnerProps) => {
  return null;
  // if (!workspace.stage.secondarySelection) return null;
  // const selectedNode: SyntheticNode = workspace.selectionRefs.map(([type, id]) => getSyntheticNodeById(browser, id)).shift();
  // if (!isSyntheticDOMNode(selectedNode)) return null;
  // const nodeWindow: SyntheticWindow = getSyntheticNodeWindow(browser, selectedNode.$id);
  // const bounds = nodeWindow.allComputedBounds[selectedNode.$id];
  // const computedStyle = (nodeWindow.allComputedStyles[selectedNode.$id] || {}) as CSSStyleDeclaration;
  // if (!bounds) return null;

  // const { width, height } = getBoundsSize(bounds);

  // const style = {
  //   fontSize: computedStyle.fontSize,
  //   color: computedStyle.color,
  //   position: "absolute",
  //   left: nodeWindow.bounds.left + bounds.left,
  //   top: nodeWindow.bounds.top + bounds.top,
  //   overflow: "visible",
  //   background: "white",
  //   minWidth: width,
  //   minHeight: height,

  //   // that may be on a white background.
  //   zIndex: 99999999
  // };

  // const textStyle = {
  //   fontSize: computedStyle.fontSize,
  //   // color: computedStyle.color,
  //   fontFamily: computedStyle.fontFamily,
  //   lineHeight: computedStyle.lineHeight,
  //   letterSpacing: computedStyle.letterSpacing,
  //   textAlign: computedStyle.textAlign,
  //   padding: computedStyle.padding,
  //   border: "none",
  // };

  // return <div style={style as any}>
  //   <span 
  //    ref={setTextarea}
  //   style={{ resize: "none", overflow: "visible", padding: 0, ...textStyle } as any} 
  //   contentEditable
  //   onChange={wrapEventToDispatch(dispatch, stageToolEditTextChanged.bind(this, selectedNode.$id))}
  //   onKeyDown={wrapEventToDispatch(dispatch, stageToolEditTextKeyDown.bind(this, selectedNode.$id))}
  //   onBlur={wrapEventToDispatch(dispatch, stageToolEditTextBlur.bind(this, selectedNode.$id))}
  //   >{getSyntheticNodeTextContent(selectedNode).trim()}</span>
  // </div>;
}

const enhanceEditTextTool = compose<EditTextToolInnerProps, EditTextToolOuterProps>(
  pure,
  withState("textarea", "setTextarea", null),
  lifecycle<EditTextToolInnerProps, any>({
    componentWillUpdate({ textarea }) {
      if (textarea && this.props.textarea !== textarea) {
        textarea.focus();
        setTimeout(() => {
          const range = textarea.ownerDocument.createRange();
          range.selectNodeContents(textarea);
          const sel = textarea.ownerDocument.defaultView.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }, 1);
      }
    }
  })
);

export const EditTextTool = enhanceEditTextTool(EditTextToolBase);
