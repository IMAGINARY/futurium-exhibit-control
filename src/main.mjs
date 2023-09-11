import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { createConsola } from 'consola';

import Server from './server.mjs';

function main() {
  const argv = yargs(hideBin(process.argv))
    .usage('Usage: $0 [options] [command1=action1] [command2=action2] ..')
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
    .option('allow', {
      type: 'array',
      description:
        'Only allow commands from these IP addresses. Allow all if not specified',
    })
    .option('dry-run', {
      alias: 'n',
      type: 'boolean',
      description: 'Simulate actions without actually doing anything',
      default: false,
    })
    .option('verbose', {
      alias: 'v',
      type: 'count',
      description:
        'Run with verbose logging. Specify multiple times for more verbosity',
      default: 0,
    })
    .wrap(yargs().terminalWidth())
    .strictOptions(true)
    .parse();

  const logger = createConsola({ fancy: false, level: argv.verbose + 1 });
  if (argv.dryRun) logger.log('Dry run. No actions will be executed');

  const commands = Object.fromEntries(
    argv._.map((cmdSpec) => cmdSpec.split('=', 2)).map(([cmd, action]) => [
      cmd.trim(),
      action ?? '',
    ]),
  );

  const options = {
    port: argv.port,
    dryRun: argv.dryRun,
    allow: argv.allow,
    logger,
    commands,
  };

  try {
    const server = new Server(options);
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
}

main();
