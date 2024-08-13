# tg-notifier

`tg-notifier` is a library for sending messages to Telegram chats using your bot, built with Node.js and TypeScript. It supports sending messages to multiple chats simultaneously and provides logging for successful and failed operations.

## Installation

To install the library, use npm:

```bash
npm install tg-notifier
```

## Usage

### Creating an Instance of `TgNotifier`

To use the `TgNotifier` library, you first need to create an instance of the `TgNotifier` class. You can configure it with your bot token, default chat ID, and other optional settings.

```typescript
import { TgNotifier } from 'tg-notifier';

const notifier = new TgNotifier({
  token: 'YOUR_BOT_TOKEN',
  chatId: 'YOUR_CHAT_ID', // Optional: Default chat ID to use if not specified in the sendMessage method
  logsDir: 'path/to/logs', // Optional: Directory for logs
  cleanIntervalHours: 24, // Optional: Interval in hours for cleaning old logs (default is 24 hours)
  chatIdsFile: 'chat_ids.txt' // Optional: File to store chat IDs
});
```

## Sending a Message

To send a message using the `TgNotifier` library, you have two main methods: `sendMessage` for sending to a specific chat and `sendToMultipleChats` for sending to multiple chats.

### Sending a Message to a Single Chat

Use the `sendMessage` method to send an HTML-formatted message to a specific chat. Provide the message content and the chat ID as parameters.

```typescript
await notifier.sendMessage('<b>Bold text</b> and <i>italic text</i>', 'CHAT_ID');
```

### Sending a Message to Multiple Chats

If you want to send a message to multiple chats at once, use the `sendToMultipleChats` method. Provide the message and an array of chat IDs.

```typescript
const chatIds = ['CHAT_ID_1', 'CHAT_ID_2'];
await notifier.sendToMultipleChats('<b>Bold text</b> and <i>italic text</i>', chatIds);
```