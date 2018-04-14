// @flow
import React from 'react';

type Props = {
  pathname: string,
  offset: number,
  hasActiveConnection?: boolean,
  history: {
    push: string => void
  }
};

// @TODO: Clean this up with <NavLink>
const activeFooterButton = 'FooterButton FooterButton--active';
const footerButton = 'FooterButton';

const footerStyles = {
  // display: 'flex',
  // justifyContent: 'space-between'
};

export default function Footer(props: Props) {
  if (!props.hasActiveConnection) {
    return <div />;
  }
  return (
    <div className="Footer" style={{ ...footerStyles, left: props.offset }}>
      <div className="FooterButtonContainer">
        <div
          onClick={() => props.history.push('/content')}
          className={
            props.pathname === '/content' ? activeFooterButton : footerButton
          }
        >
          <a>Content</a>
        </div>
        <div
          onClick={() => props.history.push('/structure')}
          className={
            props.pathname === '/structure' ? activeFooterButton : footerButton
          }
        >
          <a>Structure</a>
        </div>
      </div>
      <div
        className="FooterButtonContainer"
        style={{ ...footerStyles, left: props.offset }}
      >
        <div
          onClick={() => props.history.push('/query')}
          className={
            props.pathname === '/query' ? activeFooterButton : footerButton
          }
        >
          <a>Query</a>
        </div>
        <div
          onClick={() => props.history.push('/graph')}
          className={
            props.pathname === '/graph' ? activeFooterButton : footerButton
          }
        >
          <a>Graph</a>
        </div>
        <div
          onClick={() => props.history.push('/logs')}
          className={
            props.pathname === '/logs' ? activeFooterButton : footerButton
          }
        >
          <a>Logs</a>
        </div>
      </div>
    </div>
  );
}

Footer.defaultProps = {
  hasActiveConnection: false
};
