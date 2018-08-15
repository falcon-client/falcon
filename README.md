# falcon

[![Build Status](https://travis-ci.com/amilajack/falcon.svg?token=stGf151gAJ11ZUi8LyvG&branch=master)](https://travis-ci.com/amilajack/falcon) [![Greenkeeper badge](https://badges.greenkeeper.io/amilajack/falcon.svg?token=53682770f681eb91442da63e5ca7c9da3dfcefbe1a0c5a0218c9e8bc1823a862&ts=1534297417612)](https://greenkeeper.io/)
![Falcon Demo Rewrite](/internals/img/falcon-demo.png)

## Setup

```bash
git clone https://github.com/amilajack/falcon.git
cd falcon
yarn
lerna bootstrap
lerna run build
yarn dev

# Starting the app minimized
START_MINIMIZED=true yarn dev
# Making sure the prod build start minimized. Useful for e2e
START_MINIMIZED=true yarn build
# Running e2e tests
# NOTE: Make sure you `yarn build` before running e2e tests
yarn test-e2e
```
