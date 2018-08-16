import * as React from 'react';

type Props = {
  children: React.ReactNode,
  className?: string,
  disabled?: boolean,
  tabIndex: string,
  disabledClassName?: string,
  focus: boolean, // private
  id: string, // private
  panelId: string, // private
  selected: boolean, // private
  selectedClassName: string,
  tabRef: Function // private
};

export default class Tab extends React.Component<Props> {
  componentDidMount() {
    this.checkFocus();
  }

  componentDidUpdate() {
    this.checkFocus();
  }

  checkFocus() {
    if (this.props.selected && this.props.focus) {
      this.node.focus();
    }
  }

  render() {
    const {
      children,
      className,
      disabled,
      disabledClassName,
      focus, // unused
      id,
      panelId,
      selected,
      selectedClassName,
      tabIndex,
      tabRef,
      ...attributes
    } = this.props;

    return <div />;
  }
}
