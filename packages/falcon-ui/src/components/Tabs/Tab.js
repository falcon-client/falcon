import * as React from 'react';

type Props = {
  // children: React.ReactNode,
  // className?: string,
  // disabled?: boolean,
  // disabledClassName?: string,
  focus: boolean, // private
  // id: string, // private
  onSelect: (index: number, lastIndex: number, event: Event) => ?boolean,
  // panelId: string, // private
  selected: boolean, // private
  // selectedClassName: string,
  // tabRef: Function, // private
  tabWidth: number, // private
  tabIndex: string, // private
  title: string,
  left: number // private
};

export default class Tab extends React.Component<Props> {
  static defaultProps = {
    size: 'small'
  };

  // componentDidMount() {
  //   this.checkFocus();
  // }

  // componentDidUpdate() {
  //   this.checkFocus();
  // }

  // checkFocus() {
  //   if (this.props.selected && this.props.focus) {
  //     this.node.focus();
  //   }
  // }

  render() {
    const {
      // children,
      // className,
      // disabled,
      // disabledClassName,
      // focus, // unused
      // id,
      // panelId,
      selected,
      // selectedClassName,
      tabIndex,
      // tabRef,
      tabWidth,
      left
      // ...attributes
    } = this.props;

    return (
      <div
        className="chrome-tab"
        style={{
          transform: `translate3d(${left}px, 0, 0)`,
          width: tabWidth,
          backgroundColor: this.props.selected ? 'white' : undefined
        }}
        onClick={e => this.props.onSelect(this.props.tabIndex, e)}
      >
        <div className="chrome-tab-background" />
        <div className="chrome-tab-favicon" />
        <div className="chrome-tab-title">{this.props.title}</div>
        <div className="chrome-tab-close" />
      </div>
    );
  }
}
