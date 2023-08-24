import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import Server from './server.mjs';

function main() {
  const argv = yargs(hideBin(process.argv))
    .usage('Usage: $0 [options]')
    .option('port', {
      alias: 'p',
      type: 'number',
      description: 'UDP port to listen on',
      coerce: (port) => {
        if (port < 0 || port > 65535)
          throw new Error('Port must be between 0 and 65535');

        return port;
      },
      default: 2346,
    })
    .option('dry-run', {
      alias: 'n',
      type: 'boolean',
      description: 'Simulate actions without actually doing anything',
      default: false,
    })
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      description: 'Run with verbose logging',
      default: false,
    })
    .strict(true)
    .parse();

  const server = new Server(argv);
}

main();
