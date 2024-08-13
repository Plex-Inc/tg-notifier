import fs from 'fs';
import path from 'path';

interface TgNotifierOptions {
    /**
     * Telegram Bot Token.
     * @example '123456789:ABCDEF1234567890abcdef1234567890'
     */
    token: string;

    /**
     * Optional default chat ID to which messages will be sent.
     * If not provided, must be specified for each message.
     */
    chatId?: string;

    /**
     * Optional directory for log files.
     * Logs will be stored in 'logs' directory by default.
     * @example 'my-logs'
     */
    logsDir?: string;

    /**
     * Optional interval for cleaning old log files in hours.
     * Default is 24 hours.
     * @example 24
     */
    cleanIntervalHours?: number;

    /**
     * Optional file to store unique chat IDs.
     * @example 'chat_ids.txt'
     */
    chatIdsFile?: string;
}

class TgNotifier {
    private token: string;

    private chatId?: string;

    private logsDir: string;

    private cleanIntervalHours: number;

    private chatIdsFile?: string;

    /**
     * Creates an instance of TgNotifier.
     * @param options - Configuration options for the notifier.
     */
    constructor(options: TgNotifierOptions) {
        this.token = options.token;
        this.chatId = options.chatId;
        this.logsDir = options.logsDir || 'tg-notifier-logs';
        this.cleanIntervalHours = options.cleanIntervalHours || 24; // Default to 24 hours
        this.chatIdsFile = options.chatIdsFile || 'chat_ids.txt';

        this.createLogDirs();
        this.cleanOldLogs();
        this.startLogCleaningInterval();
    }

    /**
     * Creates the necessary directories for logs if they do not exist.
     * Logs are organized into 'success' and 'error' subdirectories.
     */
    private createLogDirs(): void {
        const successDir = path.join(this.logsDir, 'success');
        const errorDir = path.join(this.logsDir, 'error');

        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir);
        }
        if (!fs.existsSync(successDir)) {
            fs.mkdirSync(successDir);
        }
        if (!fs.existsSync(errorDir)) {
            fs.mkdirSync(errorDir);
        }
    }

    /**
     * Logs a message to a specified file.
     * @param filename - Name of the log file.
     * @param content - The log message content.
     */
    private logMessage(filename: string, content: string): void {
        const filepath = path.join(this.logsDir, filename);
        fs.appendFileSync(filepath, `${new Date().toISOString()} - ${content}\n`);
    }

    /**
     * Cleans up old log files that are older than one week.
     * Logs are stored in 'success' and 'error' subdirectories.
     */
    private cleanOldLogs(): void {
        const successDir = path.join(this.logsDir, 'success');
        const errorDir = path.join(this.logsDir, 'error');
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

        [successDir, errorDir].forEach((dir) => {
            fs.readdirSync(dir).forEach((file) => {
                const filePath = path.join(dir, file);
                const stats = fs.statSync(filePath);

                if (stats.mtime.getTime() < oneWeekAgo) {
                    fs.unlinkSync(filePath);
                    console.log(`Deleted old log file: ${filePath}`);
                }
            });
        });
    }

    /**
     * Starts a periodic interval to clean old logs based on the specified interval.
     */
    private startLogCleaningInterval(): void {
        const interval = this.cleanIntervalHours * 60 * 60 * 1000; // Convert hours to milliseconds
        setInterval(() => {
            this.cleanOldLogs();
        }, interval);
    }

    /**
     * Reads unique chat IDs from the file.
     * @returns An array of unique chat IDs.
     */
    private readChatIds(): string[] {
        if (!this.chatIdsFile || !fs.existsSync(this.chatIdsFile)) {
            return [];
        }

        return fs
            .readFileSync(this.chatIdsFile, 'utf-8')
            .split('\n')
            .filter((id) => id.trim() !== '')
            .map((id) => id.trim());
    }

    /**
     * Adds a new chat ID to the file if it does not already exist.
     * @param chatId - The chat ID to add.
     */
    private addChatId(chatId: string): void {
        const existingChatIds = new Set(this.readChatIds());
        if (!existingChatIds.has(chatId)) {
            fs.appendFileSync(this.chatIdsFile!, `${chatId}\n`);
            console.log(`Added new chat ID to file: ${chatId}`);
        }
    }

    /**
     * Sends a message to a specific chat ID or to the default chat ID if not specified.
     * @param message - The message text to send.
     * @param chatId - Optional chat ID to send the message to. If not provided, uses the default chat ID.
     * @throws Will throw an error if the message could not be sent.
     */
    public async sendMessage(message: string, chatId?: string): Promise<void> {
        const targetChatId = chatId || this.chatId;
        if (!targetChatId) {
            throw new Error('Chat ID not provided');
        }

        // Add chat ID to file
        this.addChatId(targetChatId);

        const url = `https://api.telegram.org/bot${this.token}/sendMessage`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                },
                body: JSON.stringify({
                    chat_id: targetChatId,
                    text: message,
                    parse_mode: 'html',
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.logMessage('success/success.log', `Message sent to chat ${targetChatId}: ${message}`);
        } catch (error: unknown) {
            if (error instanceof Error) {
                this.logMessage('error/error.log', `Failed to send message to chat ${targetChatId}: ${error.message}`);
                throw new Error('Failed to send message');
            }
        }
    }

    /**
     * Sends a message to multiple chat IDs.
     * @param message - The message text to send.
     * @param chatIds - An array of chat IDs to send the message to.
     * @throws Will throw an error if the message could not be sent to one or more chats.
     */
    public async sendToMultipleChats(message: string, chatIds: string[]): Promise<void> {
        const sendPromises = chatIds.map((chatId) => this.sendMessage(message, chatId));

        try {
            await Promise.all(sendPromises);
            console.log('Message sent to all chats successfully');
        } catch (error) {
            console.error('Failed to send message to one or more chats:', error);
            throw new Error('Failed to send message to one or more chats');
        }
    }
}

export default TgNotifier;
