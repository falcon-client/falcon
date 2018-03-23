import { Server } from 'hapi';
import renderVoyagerPage, { MiddlewareOptions } from './render-voyager-page';

const pkg = require('../package.json');

const hapi = function(server, options, next) {
  if (arguments.length !== 3) {
    throw new Error(
      `Voyager middleware expects exactly 3 arguments, got ${arguments.length}`
    );
  }

  const { path, route: config = {}, ...middlewareOptions } = options;

  server.route({
    method: 'GET',
    path,
    config,
    handler: (_request, reply) => {
      reply(renderVoyagerPage(middlewareOptions)).header(
        'Content-Type',
        'text/html'
      );
    }
  });

  return next();
};

const foo = {
  pkg,
  multiple: false
};

hapi.attributes = foo;

export default hapi;
