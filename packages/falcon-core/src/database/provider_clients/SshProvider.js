// @flow
import BaseProvider from './BaseProvider';
import Tunnel from '../Tunnel';
import type { sshTunnelType } from '../Tunnel';

export default class SshProvider extends BaseProvider {
  async connect() {
    if (this.database.connecting) {
      throw new Error(
        'There is already a connection in progress for this server. Aborting this new request.'
      );
    }

    if (this.database.connecting) {
      throw new Error(
        'There is already a connection in progress for this database. Aborting this new request.'
      );
    }

    try {
      this.database.connecting = true;

      // terminate any previous lost connection for this DB
      if (this.database.connection) {
        this.database.connection.disconnect();
      }

      // reuse existing tunnel
      if (this.server.config.ssh && !this.server.sshTunnel) {
        logger().debug('creating ssh tunnel');
        this.server.sshTunnel = await Tunnel(this.server.config);

        const { address, port } = this.server.sshTunnel.address();
        logger().debug(
          'ssh forwarding through local connection %s:%d',
          address,
          port
        );

        this.server.config.localHost = address;
        this.server.config.localPort = port;
      }

      const driver = clients[this.server.config.client];

      const [connection] = await Promise.all([
        driver(this.server, this.database),
        this.handleSSHError(this.server.sshTunnel)
      ]);

      this.database.connection = connection;
    } catch (err) {
      logger().error('Connection error %j', err);
      this.disconnect();
      throw err;
    } finally {
      this.database.connecting = false;
    }
  }

  handleSSHError(sshTunnel?: sshTunnelType) {
    return new Promise((resolve, reject) => {
      if (!sshTunnel) {
        return resolve(true);
      }

      sshTunnel.on('success', resolve);
      sshTunnel.on('error', error => {
        logger().error('ssh error %j', error);
        reject(error);
      });

      return resolve(true);
    });
  }
}
