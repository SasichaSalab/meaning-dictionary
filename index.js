const line = require('@line/bot-sdk');
const express = require('express');
const axios = require('axios').default;

const env = dotenv.config().parsed;
const app = express();

const lineConfig = {
    channelAccessToken: env.ACCESS_TOKEN,
    channelSecret: env.SECRET_TOKEN 
};
const client= new line.Client(lineConfig)

app.post('/webhook', line.middleware(lineConfig), async (req, res) => {
    try {
        const events = req.body.events;
        console.log('event=>>>', events);
        return events.length > 0 ? await Promise.all(events.map(handleEvent)) : res.status(200).send("OK");
    } catch (error) {
        console.error(error); 
        res.status(500).end();
    }
});

const handleEvent = async (event) => {
    if (event.type !== 'message' || event.message.type !== 'text') {
        return null;
    }
    const word = event.message.text.trim();

    try {
        const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const data = response.data[0];
        let replyText = ``;

        data.meanings.forEach((meaning, index) => {
            const definition = meaning.definitions[0];
            if (index > 0) {
                replyText += `\n\n`;
            }
            replyText += `• ${meaning.partOfSpeech}: ${definition.definition}`;
            if (definition.example) {
                replyText += `  Example: ${definition.example}\n`;
            }
        });

        await client.replyMessage(event.replyToken, { type: 'text', text: replyText });
    } catch (error) {
        console.error(error);
        await client.replyMessage(event.replyToken, { type: 'text', text: 'Sorry, I could not find the definition of that word.' });
    }
};
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log('listening on 4000');
});
