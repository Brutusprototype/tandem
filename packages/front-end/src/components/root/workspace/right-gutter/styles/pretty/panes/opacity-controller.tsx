import * as React from "react";
import {
  cssPropertyChanged,
  cssPropertyChangeCompleted
} from "../../../../../../../actions";
import { Dispatch } from "redux";
import { SyntheticElement } from "paperclip";
import { BaseOpacityPaneProps } from "./opacity.pc";
import { ComputedStyleInfo } from "../../state";

export type Props = {
  dispatch: Dispatch<any>;
  computedStyleInfo: ComputedStyleInfo;
};

export default (Base: React.ComponentClass<BaseOpacityPaneProps>) =>
  class OpacityController extends React.PureComponent<Props> {
    onChange = value => {
      this.props.dispatch(cssPropertyChanged("opacity", value));
    };
    onChangeComplete = value => {
      this.props.dispatch(cssPropertyChangeCompleted("opacity", value));
    };

    render() {
      const { onChange, onChangeComplete } = this;
      const { computedStyleInfo } = this.props;
      return (
        <Base
          sliderInputProps={{
            min: 0,
            max: 1,
            value: Number(computedStyleInfo.style.opacity || 1),
            onChange,
            onChangeComplete
          }}
        />
      );
    }
  };
