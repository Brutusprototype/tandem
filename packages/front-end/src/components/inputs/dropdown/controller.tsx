import * as React from "react";
import { DropdownMenuItem } from "./menu.pc";
import { EMPTY_ARRAY } from "tandem-common";
import { BaseDropdownProps } from "./view.pc";

export type DropdownMenuOption = {
  label: string;
  value: any;
};

export const dropdownMenuOptionFromValue = (
  value: string
): DropdownMenuOption => ({ label: value || "--", value });

export type Props = BaseDropdownProps & {
  value?: any;
  filterable?: boolean;
  options: DropdownMenuOption[];
  onChange?: (value: any) => any;
  onChangeComplete?: (value: any) => any;
};

type DropdownState = {
  open: boolean;
  filter: string;
};

export default (Base: React.ComponentClass<BaseDropdownProps>) => {
  return class DropdownController extends React.PureComponent<
    Props,
    DropdownState
  > {
    constructor(props) {
      super(props);
      this.state = {
        open: false,
        filter: null
      };
    }
    onClick = event => {
      this.setState({ ...this.state, open: !this.state.open });
      if (this.props.onClick) {
        this.props.onClick(event);
      }
    };
    onFilterChange = value => {
      this.setState({ ...this.state, filter: value });
    };
    onItemClick = (item, event) => {
      const { onChange, onChangeComplete } = this.props;
      if (onChange) {
        onChange(item.value);
      }
      if (onChangeComplete) {
        onChangeComplete(item.value);
      }
      this.setState({ ...this.state, open: false });
    };
    onKeyDown = event => {
      if (event.key === "Enter") {
        this.setState({ ...this.state, open: true });
      }
    };
    onShouldClose = () => {
      this.setState({ ...this.state, open: false });
    };

    render() {
      const {
        value,
        options = EMPTY_ARRAY,
        filterable,
        onClick,
        onChange,
        onChangeComplete,
        ...rest
      } = this.props;
      const { open, filter } = this.state;

      const menuItems = open
        ? options
            .filter(
              ({ label }) =>
                !filter || label.toLowerCase().indexOf(filter) !== -1
            )
            .map((item, i) => {
              return (
                <DropdownMenuItem
                  key={i}
                  onClick={event => this.onItemClick(item, event)}
                >
                  {item.label}
                </DropdownMenuItem>
              );
            })
        : EMPTY_ARRAY;

      const selectedItem = options.find(item => item.value === value);
      const showFilter = open && filterable;

      return (
        <Base
          popoverProps={{
            open,
            onShouldClose: this.onShouldClose
          }}
          filterInputProps={{
            style: {
              display: showFilter ? "block" : "none"
            } as any,
            value: selectedItem && selectedItem.label,
            focus: showFilter,
            onChange: this.onFilterChange
          }}
          tabIndex={0}
          onKeyDown={this.onKeyDown}
          options={menuItems}
          labelProps={{
            style: {
              display: showFilter ? "none" : "block"
            },
            text: (selectedItem && selectedItem.label) || "--"
          }}
          onClick={this.onClick}
          {...rest}
        />
      );
    }
  };
};
