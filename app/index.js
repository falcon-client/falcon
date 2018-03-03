import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import NProgress from 'nprogress';
import Root from './containers/Root';
import { configureStore, history } from './store/configureStore';
import './styles/app.global.scss';

const store = configureStore();

window.onresizeFunctions = window.onresizeFunctions || {};

// Global onresize fn
window.onresize = () => {
  Object.values(window.onresizeFunctions).forEach(fn => {
    fn();
  });
};

// Progress bar implementation
function simulateProgress() {
  NProgress.configure({
    parent: '#falcon-status-bar-container',
    showSpinner: false
  });
  NProgress.start();
  setTimeout(NProgress.done, 3000);
}

setTimeout(() => {
  simulateProgress();
}, 3000);

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
