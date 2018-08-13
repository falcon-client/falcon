//@flow
import * as React from 'react'

type Props = {
  children: React.ReactNode,
  className: string,
  defaultFocus: boolean,
  defaultIndex: number,
  disabledTabClassName: string,
  onSelect: (index: number, lastIndex: number, event: Event) => ?boolean,
  selectedIndex: number,
  selectedTabClassName: string,
  selectedTabPanelClassName: PropTypes.string,
};

export default class Tabs extends Component<Props> {
  render() {
    return (
      <div />
    );
  }
}
