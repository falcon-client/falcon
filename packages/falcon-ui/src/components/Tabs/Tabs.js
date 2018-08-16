// @flow
import * as React from 'react';

type Props = {
  children: React.ReactNode,
  className: string,
  defaultFocus: boolean,
  defaultIndex: number,
  disabledTabClassName: string,
  onSelect: (index: number, lastIndex: number, event: Event) => ?boolean,
  selectedIndex: number,
  selectedTabClassName: string,
  selectedTabPanelClassName: string
};

export default class Tabs extends React.Component<Props> {
  render() {
    return <div />;
  }
}
