import dgram from 'node:dgram';

import HaltCommand from './commands/halt.mjs';
import RestartCommand from './commands/restart.mjs';
import UnknownCommand from './commands/unknown.mjs';

class Server {
  constructor(options) {
    this.options = { ...options };
    this.commands = new Map();
    this.commands.set(HaltCommand.getId(), new HaltCommand());
    this.commands.set(RestartCommand.getId(), new RestartCommand());

    const serverSocket = dgram.createSocket('udp6');

    serverSocket.on('error', (err) => {
      console.error(`server error:\n${err.stack}`);
      serverSocket.close();
    });

    serverSocket.on('message', async (buffer, rinfo) => {
      const { address, port } = rinfo;
      console.log(`server got: '${buffer}' from ${address}:${port}`);
      let remainingMessage = buffer.toString();
      while (remainingMessage.length > 0) {
        let commandText;
        ({ commandText, remainingMessage } =
          this.processMessage(remainingMessage));
        if (commandText !== '') {
          const command = this.parseCommand(commandText);
          this.reply(command.getPreMessage(), address, port);
          const postMessage = await command.run();
          this.reply(postMessage, address, port);
        }
      }
    });

    serverSocket.on('listening', () => {
      const address = serverSocket.address();
      console.log(`server listening ${address.address}:${address.port}`);
    });

    serverSocket.bind(this.options.port);
  }

  processMessage(message) {
    const match = message.match(/\s*(\S*)\s?/);
    const commandText = match[1];
    const remainingMessage = message.substring(match[0].length);

    return { commandText, remainingMessage };
  }

  parseCommand(command) {
    console.log(`Command '${command}' received.`);

    const commandId = command; // for now, only simple commands without arguments are supported
    if (commandId in this.commands) return this.commands[commandId];

    return new UnknownCommand(commandId);
  }

  reply(message, address, port) {
    // TODO
  }
}

export { Server };
export default Server;
