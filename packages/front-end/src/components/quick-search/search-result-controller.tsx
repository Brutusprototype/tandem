import * as React from "react";
import * as cx from "classnames";
import { Dispatch } from "redux";
import {
  quickSearchItemClicked,
  quickSearchResultItemSplitButtonClick
} from "../../actions";
import { File, memoize } from "tandem-common";
import { BaseSearchResultProps } from "./row.pc";
import { BaseQuickSearchResult, QuickSearchResult } from "state";

export type Props = {
  item: QuickSearchResult;
  dispatch: Dispatch<any>;
};

type State = {
  hovering: boolean;
};

export default (Base: React.ComponentClass<BaseSearchResultProps>) =>
  class SearchResultController extends React.PureComponent<Props, State> {
    state = {
      hovering: false
    };
    onClick = () => {
      this.props.dispatch(quickSearchItemClicked(this.props.item));
    };
    onMouseEnter = () => {
      this.setState({ hovering: true });
    };
    onMouseLeave = () => {
      this.setState({ hovering: false });
    };
    onSplitButtonClick = () => {
      this.props.dispatch(
        quickSearchResultItemSplitButtonClick(this.props.item)
      );
    };
    render() {
      const { item, ...rest } = this.props;
      const { onClick, onMouseEnter, onMouseLeave, onSplitButtonClick } = this;
      const { hovering } = this.state;

      return (
        <Base
          {...rest}
          variant={cx({
            hovering
          })}
          splitTabButtonProps={{
            onClick: onSplitButtonClick
          }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onClick={onClick}
          labelProps={{ text: item.label }}
          descriptionProps={{ text: item.description }}
        />
      );
    }
  };
