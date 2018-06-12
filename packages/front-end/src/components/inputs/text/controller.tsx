import * as React from "react";
import * as ReactDOM from "react-dom";
import { compose, pure, withHandlers, lifecycle, withProps } from "recompose";

export const withInputHandlers = () =>
  compose(
    withHandlers({
      onKeyDown: ({ onChange, onChangeComplete }) => event => {
        if (onChange) {
          onChange(event.target.value || undefined);
        }

        if (event.key === "Enter" && onChangeComplete) {
          onChangeComplete(event.target.value || "");
        }
      },
      onBlur: ({ onChangeComplete }) => event => {
        if (onChangeComplete) {
          onChangeComplete(event.target.value);
        }
      }
    }),
    lifecycle({
      componentDidUpdate(props: any) {
        if (props.value !== this.props.value) {
          const input = ReactDOM.findDOMNode(
            this as any
          ) as HTMLTextAreaElement;
          if (document.activeElement !== input) {
            input.value = this.props.value == null ? "" : this.props.value;
          }
        }
      }
    })
  );

export default compose<any, any>(
  pure,
  withInputHandlers(),
  Base => ({ value, onChange, ...rest }) => {
    return <Base {...rest} defaultValue={value} />;
  }
);
