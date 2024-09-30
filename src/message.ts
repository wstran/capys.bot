import Database from "./libs/database";
import { TelegramQueue } from "./libs/telegram";

const telegram = TelegramQueue.getInstance(process.env.BOT_TOKEN!);

const message = async () => {
    const dbInstance = Database.getInstance();
    const db = await dbInstance.getDb();
    const todoCollection = db.collection('todos');

    const sendPendingMessages = async () => {
        const messages = await todoCollection.find({ todo_type: 'bot:send/tele/message', status: 'pending' }).project({ _id: 1, target_id: 1, message: 1, buttons: 1, photo: 1 }).toArray();

        for (let i = 0; i < messages.length; ++i) {
            const { _id, target_id, message, buttons, photo } = messages[i];

            telegram.enqueueMessage(target_id, message, buttons, photo, async (data) => {
                data.result && await todoCollection.updateOne({ _id }, { $set: { message_data: data, status: 'completed', completed_at: new Date() } });
            }, async () => {
                await todoCollection.updateOne({ _id }, { $set: { status: 'failed', failed_at: new Date() } });
            });
        };
    };

    sendPendingMessages();

    const interval_id = setInterval(sendPendingMessages, 60 * 1000);

    const changeStream = todoCollection.watch();

    changeStream.on('change', async (event) => {
        if (event.operationType === 'insert' && event.fullDocument.todo_type === 'bot:send/tele/message') {
            const { _id, target_id, message, buttons, photo } = event.fullDocument;

            telegram.enqueueMessage(target_id, message, buttons, photo, async (data) => {
                data.result && await todoCollection.updateOne({ _id }, { $set: { message_data: data, status: 'completed', completed_at: new Date() } });
            }, async () => {
                await todoCollection.updateOne({ _id }, { $set: { status: 'failed', failed_at: new Date() } });
            });
        }
    });

    changeStream.on('error', (error) => {
        console.error('Change stream error:', error);

        clearInterval(interval_id);

        setTimeout(() => {
            console.log('Retrying to start the stream...');
            message();
        }, 4000);
    });

    changeStream.on('end', () => {
        console.log('Change stream ended. Retrying...');
        
        clearInterval(interval_id);

        setTimeout(() => {
            message();
        }, 4000);
    });
}

message();