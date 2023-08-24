import Command from './command.mjs';

export default class UnknownCommand extends Command {
  constructor(id) {
    super({
      id,
      preMessage: `Unknown command '${id}'`,
      action: async () => undefined,
    });
  }
}
