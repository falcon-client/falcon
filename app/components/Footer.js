// @flow
import React from 'react';
import { Link } from 'react-router-dom';

type Props = {
  offset: number
};

export default function Footer(props: Props) {
  return (
    <div className="Footer" style={{ left: props.offset }}>
      <div className="FooterButtonContainer">
        <div className="FooterButton FooterButton--active">
          <Link to="/home/content">Content</Link>
        </div>
        <div className="FooterButton">
          <Link to="/home/query">Query</Link>
        </div>
        <div className="FooterButton">
          <Link to="/home/structure">Structure</Link>
        </div>
        <div className="FooterButton">
          <Link to="/home/graph">Graph</Link>
        </div>
      </div>
    </div>
  );
}
