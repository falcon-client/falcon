// @flow
import React from 'react';
import { Link } from 'react-router-dom';

type Props = {
  pathname: string,
  offset: number
};

// @TODO: Clean this up with <NavLink>
const activeFooterButton = 'FooterButton FooterButton--active';
const footerButton = 'FooterButton';

export default function Footer(props: Props) {
  return (
    <div className="Footer" style={{ left: props.offset }}>
      <div className="FooterButtonContainer">
        <div
          className={
            props.pathname === '/home/login'
              ? activeFooterButton
              : footerButton
          }
        >
          <Link to="/home/login">Login</Link>
        </div>
        <div
          className={
            props.pathname === '/home/content'
              ? activeFooterButton
              : footerButton
          }
        >
          <Link to="/home/content">Content</Link>
        </div>
        <div
          className={
            props.pathname === '/home/query' ? activeFooterButton : footerButton
          }
        >
          <Link to="/home/query">Query</Link>
        </div>
        <div
          className={
            props.pathname === '/home/structure'
              ? activeFooterButton
              : footerButton
          }
        >
          <Link to="/home/structure">Structure</Link>
        </div>
        <div
          className={
            props.pathname === '/home/graph' ? activeFooterButton : footerButton
          }
        >
          <Link to="/home/graph">Graph</Link>
        </div>
      </div>
    </div>
  );
}
