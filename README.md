ADAMANT Watchbot is a software that watches ADAMANT blockchain transactions, notifies about specific ones, and able to recoup some of them according to your settings.

# Features

* Easy to install and configure
* Free and open source
* Notifies about specific transactions
* Recoups specific transactions or its fees
* Managed with your commands using ADAMANT Messenger

# Usage and Installation

After installation, you control the bot in secure ADAMANT Messenger chat directly.

Available commands: ask a bot with `/help` command.

## Requirements

* Ubuntu 16, 18 or 20 (we didn't test others)
* NodeJS v 10+
* MongoDB ([installation instructions](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/))

## Setup

```
su - adamant
git clone https://github.com/Adamant-im/adamant-watchbot
cd ./adamant-watchbot
npm i
```

## Pre-launch tuning

```
nano config.json
```

Parameters:

* `passPhrase` <string> The bot's secret phrase for accepting commands. Obligatory. Bot's ADM address will correspond this passPhrase.
* `admin_accounts` <string, array> ADAMANT accounts to accept commands from. Commands from other accounts will not be executed. At lease one account.
* `notify_non_admins` <boolean> Notify non-admins that they are not admins. If false, bot will be silent.
* `node_ADM` <string, array> List of nodes for API work, obligatorily
* `infoservice` <string, array> List of [ADAMANT InfoServices](https://github.com/Adamant-im/adamant-currencyinfo-services) for catching exchange rates, recommended
* `slack` <string, array> Tokens for Slack notifications. No alerts if not set.
* `adamant_notify` <string, array> ADM addresses for notifications. Recommended.
* `socket` <boolean> If to use WebSocket connection. Recommended for better user experience.
* `ws_type` <string> Choose socket connection, "ws" or "wss" depending on your server
* `bot_name` <string> Bot's name for notifications
* `welcome_string` <string> How to reply user in-chat, if unknown command received

## Launching

You can start the Bot with the `node app` command, but it is recommended to use the process manager for this purpose.

```
pm2 start --name watchbot app.js
```

## Add Bot to cron

```
crontab -e
```

Add string:

```
@reboot cd /home/adamant/adamant-watchbot && pm2 start --name watchbot app.js
```

## Updating

```
su - adamant
cd ./adamant-watchbot
pm2 stop watchbot
mv config.json config_bup.json && git pull && mv config_bup.json config.json
npm i
pm2 start --name watchbot app.js
```
