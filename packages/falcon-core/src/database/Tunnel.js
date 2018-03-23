// @flow
import net from 'net';
import { Client } from 'ssh2';
import { getPort, readFile } from '../Utils';
import createLogger from '../Logger';

export type tunnelConfigType = {
  username: string,
  port: number,
  host: string,
  dstPort: string,
  dstHost: string,
  sshPort: number,
  srcPort: number,
  srcHost: string,
  localHost: string,
  localPort: number,
  password?: string,
  passphrase?: string,
  privateKey?: string,
  ssl?: {
    rejectUnauthorized: boolean
  }
};

export type sshTunnelType = {
  address: () => {
    address: string,
    port: number
  },
  on: (event: 'success' | 'error', () => void) => sshTunnelType
};

async function configTunnel(serverInfo): Promise<tunnelConfigType> {
  const config: tunnelConfigType = {
    username: serverInfo.ssh.user,
    port: serverInfo.ssh.port,
    host: serverInfo.ssh.host,
    dstPort: serverInfo.port,
    dstHost: serverInfo.host,
    sshPort: 22,
    srcPort: 0,
    srcHost: 'localhost',
    localHost: 'localhost',
    localPort: await getPort()
  };

  if (serverInfo.ssh.password) {
    config.password = serverInfo.ssh.password;
  }
  if (serverInfo.ssh.passphrase) {
    config.passphrase = serverInfo.ssh.passphrase;
  }
  if (serverInfo.ssh.privateKey) {
    config.privateKey = await readFile(serverInfo.ssh.privateKey);
  }

  return config;
}

export default function Tunnel(serverInfo: Object): Promise<Object> {
  const logger = createLogger('db:tunnel');

  return new Promise(async (resolve, reject) => {
    logger().debug('configuring tunnel');
    const config = await configTunnel(serverInfo);

    const connections = [];

    logger().debug('creating ssh tunnel server');
    const server = net.createServer(async conn => {
      conn.on('error', err => server.emit('error', err));

      logger().debug('creating ssh tunnel client');
      const client = new Client();
      connections.push(conn);

      client.on('error', err => server.emit('error', err));

      client.on('ready', () => {
        logger().debug('connected ssh tunnel client');
        connections.push(client);

        logger().debug('forwarding ssh tunnel client output');
        client.forwardOut(
          config.srcHost,
          config.srcPort,
          config.dstHost,
          config.dstPort,
          (err, sshStream) => {
            if (err) {
              logger().error('error ssh connection %j', err);
              server.close();
              server.emit('error', err);
              return;
            }
            server.emit('success');
            conn.pipe(sshStream).pipe(conn);
          }
        );
      });

      try {
        const localPort = await getPort();

        logger().debug('connecting ssh tunnel client');
        client.connect({ ...config, localPort });
      } catch (err) {
        server.emit('error', err);
      }
    });

    server.once('close', () => {
      logger().debug('close ssh tunnel server');
      connections.forEach(conn => conn.end());
    });

    logger().debug('connecting ssh tunnel server');
    server.listen(config.localPort, config.localHost, undefined, err => {
      if (err) return reject(err);
      logger().debug('connected ssh tunnel server');
      return resolve(server);
    });
  });
}
