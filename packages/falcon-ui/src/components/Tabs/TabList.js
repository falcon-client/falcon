import React, { Children, Component } from 'react';

type Props = {
  children: React.ReactNode,
  // className: string,
  // id: string, // private
  clientWidth: number,
  minTabWidth: number,
  maxTabWidth: number,
  onSelect: (index: number, lastIndex: number, event: Event) => ?boolean,
  // selectedClassName: string,
  selectedIndex: number, // private
  tabOverlapDistance: number
  // tabId: string // private
};

export default class TabList extends Component<Props> {
  getTabWidth = (): number => {
    console.log('In get tabWidth');
    const tabsContentWidth =
      this.props.clientWidth - this.props.tabOverlapDistance;
    const tabWidth =
      tabsContentWidth / Children.count(this.props.children) +
      this.props.tabOverlapDistance;
    return Math.max(
      this.props.minTabWidth,
      Math.min(this.props.maxTabWidth, tabWidth)
    );
  };

  getTabEffectiveWidth = () =>
    this.getTabWidth() - this.props.tabOverlapDistance;

  renderChildren = () => {
    const tabWidth = this.getTabEffectiveWidth();
    return React.Children.map(this.props.children, (child, i) =>
      React.cloneElement(child, {
        key: i,
        left: tabWidth * i,
        onSelect: this.props.onSelect,
        selected: this.props.selectedIndex === i ? true : undefined,
        tabWidth,
        tabIndex: i
      })
    );
  };

  render() {
    return (
      <div className="chrome-tabs">
        <div className="chrome-tabs-content">{this.renderChildren()}</div>
        <div className="chrome-tabs-bottom-bar" />
      </div>
    );
  }
}
