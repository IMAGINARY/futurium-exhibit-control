import { exec } from 'node:child_process';

import Command from './command.mjs';

export default class HaltCommand extends Command {
  constructor() {
    super({
      id: HaltCommand.getId(),
      preMessage: 'Shutting down system',
      action: async () => exec('poweroff'),
    });
  }

  static getId() {
    return 'halt';
  }
}
