'use strict';

/** Port number for the UDP Discovery service */
const PORT_UDP_DISCOVERY = process.env.RPIBOT_DISCOVERY_PORT || 8089;
/** Port number for the TCP response to a successful UDP Discovery */
const PORT_TCP_RESPONSE = process.env.RPIBOT_RESPONSE_PORT || 8090;
const MSG_DISCOVER_ADDR = 'DISCOVER_PIBOT_ADDR';

/**
 * Places the device into Discoverable Mode.
 *
 * Waits for a UDP dicovery packet from a potential client, then repsonds with
 * a short-lived TCP connection to confirm this devices' existence and
 * willingness to conncect.
 */
function allowDiscovery() {
  // Datagram module - UDP
  const { createSocket } = require('dgram');
  let server = createSocket('udp4');
  server.bind(PORT_UDP_DISCOVERY);

  // On udp message received
  server.on('message', (message, rinfo) => {
    if (message.toString() === MSG_DISCOVER_ADDR) {
      console.log('UDP Discovery - Discovered (' + rinfo.address + ')');
      // Respond to Discovery enquiry through a TCP socket
      const { Socket } = require('net');
      let client = new Socket();
      client.on('error', err => {
        console.error(err);
        console.debug('UDP Discovery - Cleaning up after error');
        client.destroy();
        server.close();
        console.log('UDP Discovery - Disabled');
      });
      client.connect(PORT_TCP_RESPONSE, rinfo.address, () => {
        // No need to send message, just connect, as the connection meta data
        // (remote IP address) will be used to setup a new connection
        console.debug('UDP Discovery - Connected to requester and IP shared');
        // Cleanup after connection
        client.destroy();
        server.close();
        console.log('UDP Discovery - Disabled');
      });
    }
  });

  // On udp server started and listening.
  server.on('listening', () => {
    // Debug output - IP and port
    const address = server.address();
    console.log(
      'UDP Discovery - Enabled - ' + address.address + ':' + address.port,
    );
  });
}

// Exports

module.exports = {
  // Constants
  PORT_UDP_DISCOVERY,
  PORT_TCP_RESPONSE,
  MSG_DISCOVER_ADDR,
  // Functions
  allowDiscovery,
};