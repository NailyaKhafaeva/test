const express = require('express');
const app = express();
app.use(express.json());
const PORT = 3000;

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

        await channel.consume(resultQueue, (message) => {
            console.log('Consuming "result_queue"');
            console.log(`Received ${Buffer.from(message.content)}`);
            channel.ack(message);
        });
    } catch (error) {
        console.log(error);
    }
}

app.post('/api', (req, res) => {
    const message = req.body;

    console.log(`Received POST request with body ${JSON.stringify(message)}`);

    // отправление сообщения на все сервисы, которые прослушивают очередь 'task_queue'
    channel.sendToQueue(
        taskQueue,
        Buffer.from(
            JSON.stringify({
                ...message,
                date: new Date(),
            })
        )
    );

    res.send(`Message sent`);
    console.log(`Message ${JSON.stringify(message)} sent to "task_queue"`);
});

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});
