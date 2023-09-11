# udp-commander

This is a simple UDP server that listens for commands and execute predefined actions based on the command received.

## Installation

Install the project dependencies by running the following command:

```bash
npm install
```

If you want to install the server globally (for the current user), run the following command:

```bash
npm install -g
```

## Usage

You can run the server either from the project folder via
```shell
npm run start -- [options] [command1=action1] [command2=action2] ..
```
or, when installed globally, via
```shell
udp-commander [options] [command1=action1] [command2=action2] ..
```
The following options are available:
```shell
$ udp-commander --help
Usage: udp-commander [options] [command1=action1] [command2=action2] ..

Options:
      --help     Show help                                                                         [boolean]
      --version  Show version number                                                               [boolean]
  -p, --port     UDP port to listen on                                              [number] [default: 2346]
      --allow    Only allow commands from these IP addresses. Allow all if not specified             [array]
  -n, --dry-run  Simulate actions without actually doing anything                 [boolean] [default: false]
  -v, --verbose  Run with verbose logging. Specify multiple times for more verbosity    [count] [default: 0]
```

If a `command` is received by the server, it will execute the associated `action` in a shell. Each positional argument to `udp-commander` will be split at the `=` character, if present. The first part is considered the `command`. The remaining part is considered the `action` and is ***passed verbatim to a shell***. Only actions that are considered safe should be exposed by the server.

Note that no authentication is provided. However, it is possible to restrict command execution to specific IP addresses by using the `--allow` option. If this option is not specified, all IP addresses are allowed.

## Example

A simple use case is to shutdown or reboot a system. This can be achieved by running the following command:

```shell
udp-commander "halt=poweroff" "reboot=reboot" "ping=echo pong"
```

You can test the setup by executing
```shell
echo ping | nc -u <ip> 2346
```

The server sends back the output of the executed action, which is `pong` in case of the `ping` action.

## Systemd service configuration

You may wish to run the server via systemd on a Linux system. The following configuration file can be used as a starting point.

It assumes Ubuntu as the operating system and that the `udp-commander`  repository in installed in `/opt/udp-commander`. Furthermore, an appropriate NodeJS version is installed `/opt/udp-commander/.nodejs` (you can also use an existing NodeJS installation by changing the `Environment` variable accordingly).

```ini
[Unit]
Description=UDP Commander
After=network.target

[Service]
Type=simple
Restart=always
User=root
WorkingDirectory=/opt/udp-commander
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin:/opt/udp-commander/.nodejs/bin
ExecStart=/opt/udp-commander/udp-commander -vvv -p 2346 "halt=poweroff" "reboot=reboot" "ping=echo pong"

[Install]
WantedBy=multi-user.target
```

The `Environment` variable is derived from the local output of
```shell
echo "PATH=$PATH:/opt/udb-commander/"
```

## Credits

Written by Christian Stussak for IMAGINARY gGmbH.

## License

Copyright 2023 IMAGINARY gGmbH

Licensed under the MIT license (see the [`LICENSE`](LICENSE) file).
