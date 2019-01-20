// @flow
import React, { Children, Component } from 'react';

type Props = {
  children: React.ReactNode,
  // className: string,
  // defaultFocus: boolean,
  // defaultIndex: number,
  // disabledTabClassName: string,
  onSelect: (index: number, lastIndex: number, event: Event) => ?boolean,
  selectedIndex: number,
  // selectedTabClassName: string,
  // selectedTabPanelClassName: string,
  width: number
};

export default class Tabs extends Component<Props> {
  renderChildren = () =>
    Children.map(this.props.children, child =>
      // console.log('In Tab.js');
      // console.dir(child);
      React.cloneElement(child, {
        selectedIndex: this.props.selectedIndex,
        onSelect: this.props.onSelect
      })
    );

  // renderSelectedTab = (i: number) => {};

  render() {
    return (
      <div className="chrome-tabs" style={{ width: this.props.width }}>
        <div className="chrome-tabs-content">{this.renderChildren()}</div>
        <div className="chrome-tabs-bottom-bar" />
      </div>
    );
  }
}
