# falcon

[![Build Status](https://travis-ci.com/falcon-client/falcon.svg?token=stGf151gAJ11ZUi8LyvG&branch=master)](https://travis-ci.com/falcon-client/falcon)
![Falcon Demo Rewrite](/internals/img/falcon-demo.png)

## Setup

```bash
git clone https://github.com/falcon-client/falcon.git
cd falcon
yarn
yarn build
yarn dev

# Starting the app minimized
START_MINIMIZED=true yarn dev
# Making sure the prod build start minimized. Useful for e2e
START_MINIMIZED=true yarn build
# Running e2e tests
# NOTE: Make sure you `yarn build` before running e2e tests
yarn test-e2e
```
