import { exec } from 'node:child_process';

import Command from './command.mjs';

export default class RestartCommand extends Command {
  constructor() {
    super({
      id: RestartCommand.getId(),
      preMessage: 'Restarting application',
      action: async () => exec('killall exhibit-default'),
    });
  }

  static getId() {
    return 'restart';
  }
}
