import React, { Component } from 'react';
import { render } from 'react-dom';
import Button from '../src/components/Button';
import '../src/styles/app.global.scss';

class Root extends Component {
  render() {
    return <Button>Foobar</Button>;
  }
}

render(<Root />, document.querySelector('#root'));
