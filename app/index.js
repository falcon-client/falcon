import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import Root from './containers/Root';
import { configureStore, history } from './store/configureStore';
import './styles/app.global.scss';
import '@falcon-client/falcon-ui/src/styles/app.global.scss';

const store = configureStore();

window.onresizeFunctions = window.onresizeFunctions || {};

// Global onresize fn
window.onresize = () => {
  Object.values(window.onresizeFunctions).forEach(fn => {
    fn();
  });
};

render(
  <AppContainer>
    <Root store={store} history={history} />
  </AppContainer>,
  document.getElementById('root')
);

if (module.hot) {
  module.hot.accept('./containers/Root', () => {
    const NextRoot = require('./containers/Root'); // eslint-disable-line global-require
    render(
      <AppContainer>
        <NextRoot store={store} history={history} />
      </AppContainer>,
      document.getElementById('root')
    );
  });
}
