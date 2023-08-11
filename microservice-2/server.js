const express = require('express');
const app = express();
app.use(express.json());
const PORT = 3001;

const amqplib = require('amqplib');
let channel, connection;

const amqpServer = 'amqp://localhost:5672';
const taskQueue = 'task_queue';
const resultQueue = 'result_queue';

connect();

// покдлючение к rabbitMQ
async function connect() {
    try {
        connection = await amqplib.connect(amqpServer);
        channel = await connection.createChannel();

        console.log(`Connected to the ${amqpServer}`);

        await channel.assertQueue(resultQueue);
        await channel.assertQueue(taskQueue);

        await channel.consume(taskQueue, (message) => {
            console.log('Consuming "task_queue"');
            console.log(`Received ${Buffer.from(message.content)}`);
            channel.ack(message);

            let editedMessage = editMessage(message);

            console.log('Received message edited');

            // отправление сообщения на все сервисы, которые прослушивают очередь 'result_queue'
            channel.sendToQueue(
                resultQueue,
                Buffer.from(
                    JSON.stringify({
                        editedMessage,
                        date: new Date(),
                    })
                )
            );

            console.log('Edited message sent to "result_queue"');
        });
    } catch (error) {
        console.log(error);
    }
}

function editMessage(message) {
    message = 'meow';
    return message;
}

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});
