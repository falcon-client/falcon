import * as React from 'react';

type Props = {
  children: React.ReactNode,
  className: string,
  id: string, // private
  selected: boolean, // private
  selectedClassName: string,
  tabId: string // private
};

export default class TabPanel extends React.Component<Props> {
  render() {
    return <div />;
  }
}
