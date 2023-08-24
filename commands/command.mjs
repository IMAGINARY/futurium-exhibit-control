export default class Command {
  constructor({ id, preMessage, action, dryAction }) {
    this.id = id;
    this.preMessage = preMessage;
    this.action = action;
    this.dryAction =
      typeof dryAction !== 'undefined'
        ? dryAction
        : () => `Dry-run not implemented for command '${this.id}'`;
  }

  getPreMessage() {
    return this.preMessage;
  }

  async run(dry = false) {
    return dry ? await this.dryAction() : await this.action();
  }
}
