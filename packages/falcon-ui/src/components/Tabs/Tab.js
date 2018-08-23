import * as React from 'react';

type Props = {
  // children: React.ReactNode,
  // className?: string,
  // disabled?: boolean,
  // tabIndex: string,
  // disabledClassName?: string,
  title: string,
  focus: boolean, // private
  // id: string, // private
  // panelId: string, // private
  selected: boolean, // private
  // selectedClassName: string,
  // tabRef: Function, // private
  left: number, // private
  tabWidth: number // private
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
      // children,
      // className,
      // disabled,
      // disabledClassName,
      // focus, // unused
      // id,
      // panelId,
      // selected,
      // selectedClassName,
      // tabIndex,
      // tabRef,
      tabWidth,
      left
      // ...attributes
    } = this.props;

    return (
      <div
        className="chrome-tab"
        style={{ transform: `translate3d(${left}px, 0, 0)`, width: tabWidth }}
      >
        <div className="chrome-tab-background" />
        <div className="chrome-tab-favicon" />
        <div className="chrome-tab-title">{this.props.title}</div>
        <div className="chrome-tab-close" />
      </div>
    );
  }
}
