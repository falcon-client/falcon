// @flow
import React, { Children, Component } from 'react';

type Props = {
  children: React.ReactNode,
  className: string,
  defaultFocus: boolean,
  defaultIndex: number,
  disabledTabClassName: string,
  selectedIndex: number,
  selectedTabClassName: string,
  selectedTabPanelClassName: string,
  width: number,
  onSelect: (index: number, lastIndex: number, event: Event) => ?boolean
};

export default class Tabs extends Component<Props> {
  renderChildren = () =>
    React.Children.map(this.props.children, child =>
      // console.log('In Tab.js');
      // console.dir(child);
      React.cloneElement(child, {})
    );

  3;

  getTabWidth(): number {
    const tabsContentWidth =
      this.tabContentEl.clientWidth - this.options.tabOverlapDistance;
    const width =
      tabsContentWidth / this.tabEls.length + this.options.tabOverlapDistance;
    return Math.max(
      this.options.minWidth,
      Math.min(this.options.maxWidth, width)
    );
  }

  renderSelectedTab = (i: number) => {};

  render() {
    return (
      <div className="chrome-tabs" style={{ width: this.props.width }}>
        <div className="chrome-tabs-content">{this.renderChildren()}</div>
        <div className="chrome-tabs-bottom-bar" />
      </div>
    );
  }
}
