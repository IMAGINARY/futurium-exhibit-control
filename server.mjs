import dgram from 'node:dgram';
import { spawn } from 'node:child_process';
import { promisify } from 'node:util';

import escape from 'js-string-escape';

class Server {
  constructor(options) {
    this.options = { ...options };
    this.logger = this.options.logger;
    this.commands = new Map();
    (Object.entries(this.options.commands) ?? []).forEach(
      ([command, action]) => {
        this.registerCommand(command, action);
      },
    );

    this.serverSocket = dgram.createSocket('udp6');

    this.sendMessage = promisify(
      this.serverSocket.send.bind(this.serverSocket),
    );

    this.serverSocket.on('error', this.handleErrorEvent.bind(this));
    this.serverSocket.on('message', this.handleMessageEvent.bind(this));
    this.serverSocket.on('listening', this.handleListeningEvent.bind(this));

    this.serverSocket.bind(this.options.port);
  }

  registerCommand(command, action) {
    this.logger.log(
      `Registering command '${escape(command)}' with action '${escape(
        action,
      )}'`,
    );
    if (!command.match(/^[a-zA-Z0-9\-_]+$/))
      throw new Error(
        `Invalid command name '${escape(command)}.` +
          'Only alphanumeric characters, dashes and underscores are allowed.',
      );
    this.commands.set(command, action);
  }

  handleErrorEvent(error) {
    console.error(`Server error:\n${error.stack}`);
    this.serverSocket.close();
  }

  handleListeningEvent() {
    const { address, port } = this.serverSocket.address();
    this.logger.log(`Server listening on ${address}:${port}`);
  }

  async handleMessageEvent(buffer, { address, port }) {
    let remainingMessage = buffer.toString();
    this.logger.info(
      `Message '${escape(remainingMessage)}' received from ${address}:${port}`,
    );
    while (remainingMessage.length > 0) {
      let command;
      ({ command, remainingMessage } = this.tokenizeMessage(remainingMessage));
      if (command !== '') {
        const action = this.getAction(command);
        if (typeof action === 'undefined') {
          this.reply(`Unknown command '${escape(command)}'\n`, address, port);
        } else {
          this.executeAction(action, (msg) => this.reply(msg, address, port));
        }
      }
    }
  }

  tokenizeMessage(message) {
    const match = message.match(/\s*(\S*)\s?/);
    const command = match[1];
    const remainingMessage = message.substring(match[0].length);

    return { command, remainingMessage };
  }

  getAction(command) {
    const action = this.commands.get(command);
    if (typeof action === 'undefined')
      this.logger.log(
        `Command '${escape(command)}' received. Associated action: None`,
      );
    else
      this.logger.log(
        `Command '${escape(command)}' received. ` +
          `Associated action: '${escape(action)}'`,
      );

    return action;
  }

  async executeAction(action, replyCallback) {
    if (this.options.dryRun) {
      const msg = `Executing action '${escape(action)}' (dry run)`;
      this.logger.log(msg);
      await replyCallback(msg + '\n');
    } else {
      const msg = `Executing action '${escape(action)}'`;
      this.logger.log(msg);
      await replyCallback(msg + '\n');
      try {
        await this.executeShellCommand(action, replyCallback);
      } catch ({ code, signal }) {
        if (code !== null) {
          const errorMsg = `Child process finished with exit code ${code}`;
          this.logger.log(errorMsg);
          replyCallback(errorMsg + '\n');
        } else if (signal !== null) {
          const errorMsg = `Child process killed with ${signal}`;
          this.logger.log(errorMsg);
          replyCallback(errorMsg + '\n');
        }
      }
    }
  }

  async executeShellCommand(command, replyCallback) {
    return new Promise((resolve, reject) => {
      const childProcess = spawn(command, { shell: true });

      childProcess.stdout.on('data', (data) => {
        const str = data.toString();
        this.logger.log(str);
        replyCallback(str);
      });

      childProcess.stderr.on('data', (data) => {
        const str = data.toString();
        this.logger.warning(str);
        replyCallback(str);
      });

      childProcess.on('close', (code, signal) => {
        childProcess.stdout.removeAllListeners();
        childProcess.stderr.removeAllListeners();
        childProcess.removeAllListeners();
        if (code === 0) resolve();
        else reject({ code, signal });
      });
    });
  }

  async reply(message, address, port) {
    try {
      this.logger.debug(`Sending '${escape(message)}' to ${address}:${port}`);
      await this.sendMessage(message, port, address);
    } catch (error) {
      this.logger.error(
        `Sending '${escape(message)}' to ${address}:${port} failed: ${error}`,
      );
    }
  }
}

export { Server };
export default Server;
