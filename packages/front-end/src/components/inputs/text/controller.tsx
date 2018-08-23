import * as React from "react";
import * as ReactDOM from "react-dom";
import { compose, pure, withHandlers, lifecycle } from "recompose";
import { FocusComponent, FocusProps } from "../../focus";
import { BaseTextInputProps } from "./view.pc";

export type WithInputHandlersProps = {
  value?: any;
  onChange?: any;
  onChangeComplete?: any;
} & BaseTextInputProps;

export const withPureInputHandlers = () => (
  Base: React.ComponentClass<any>
) => {
  return class InputHandlersWrapper extends React.PureComponent<
    WithInputHandlersProps
  > {
    onKeyDown = event => {
      const { onChange, onChangeComplete } = this.props;
      const nativeEvent = event.nativeEvent;
      setImmediate(() => {
        const {
          key,
          target: { value }
        } = nativeEvent;
        if (onChange) {
          onChange(value || undefined);
        }

        if (key === "Enter" && onChangeComplete) {
          onChangeComplete(value || "");
        }
      });
    };
    onBlur = event => {
      const { onChangeComplete } = this.props;
      if (onChangeComplete) {
        onChangeComplete(event.target.value);
      }
    };
    componentDidUpdate(props) {
      if (props.value !== this.props.value) {
        const input = ReactDOM.findDOMNode(this as any) as HTMLTextAreaElement;
        if (document.activeElement !== input) {
          input.value = this.props.value == null ? "" : this.props.value;
        }
      }
    }
    render() {
      const { onKeyDown, onBlur } = this;
      return <Base {...this.props} onKeyDown={onKeyDown} onBlur={onBlur} />;
    }
  };
};

export type Props = WithInputHandlersProps & FocusProps;

export default compose<BaseTextInputProps, Props>(
  withPureInputHandlers(),
  (Base: React.ComponentClass<BaseTextInputProps>) => ({
    value,
    focus,
    onChange,
    onChangeComplete,
    ...rest
  }) => {
    return (
      <FocusComponent focus={Boolean(focus)}>
        <Base {...rest} defaultValue={value} />
      </FocusComponent>
    );
  }
);
