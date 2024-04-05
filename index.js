import { AssemblyAI } from "assemblyai";
import TelegramBot from 'node-telegram-bot-api';
import * as googleTTS from "google-tts-api";
import dotenv from 'dotenv';
dotenv.config();

const tgBotToken = process.env.TG_BOT_TOKEN;
const AssemblyAIKey = process.env.ASSEMBLYAI_KEY;
const botUserName = process.env.BOT_USERNAME;

const bot = new TelegramBot(tgBotToken, {polling: true});
const client = new AssemblyAI({apiKey: AssemblyAIKey});

const SpeechToText = async (msg, file_path) => {
    console.log('Информациия о сообщении:',msg);
    await client.transcripts.create({
        audio_url: `https://api.telegram.org/file/bot${tgBotToken}/${file_path}`,
        language_code: 'ru'
    })
        .then((res) => {
            const text = res.text !== '' ? res.text : 'Текст не распознан'
            console.log('Текст сообщения:', res.text);
            bot.sendMessage(msg.chat.id, text, {
                reply_parameters: {
                    message_id: msg.message_id,
                    chat_id: msg.chat.id
                }
            });
        });
};

const TextToSpeech = (msg) => {
    const audioUrl = googleTTS.getAudioUrl(msg.text.slice(5), {
        lang: 'ru',
        slow: false,
        host: 'https://translate.google.com',
    });

    console.log(audioUrl);

    bot.sendVoice(msg.chat.id, audioUrl, {
        caption: `Сообщение от ${msg.from.first_name}`
    })
    bot.deleteMessage(msg.chat.id, msg.message_id)
}

bot.on('message', (msg) => {
    const oldDate = new Date(msg.date * 1000)
    const nowDate = new Date ()
    const isTooOldMsg = (nowDate - oldDate)/1000/60/60 < 0.1

    if (isTooOldMsg) {
        console.log(botUserName)
        if (msg.voice) {
            bot.getFile(msg.voice.file_id)
                .then((res) => {
                    SpeechToText(msg, res.file_path)
                })
        } else if (msg.text.match(/^\/tts .+/) || msg.text.match(`^\\/tts@${botUserName} .+`)) {
            console.log(msg)
            TextToSpeech(msg)
        } else if (msg.text === '/tts' || msg.text === `/tts@${botUserName}` ) {
            bot.sendMessage(msg.chat.id, 'Введи текст', {
                reply_parameters: {
                    message_id: msg.message_id,
                    chat_id: msg.chat.id
                }
            })
        }
    }
});


// const keyboard = [
//     [
//         {
//             text: 'Хочу кота', // текст на кнопке
//             callback_data: 'moreKeks' // данные для обработчика событий
//         }
//     ],
//     [
//         {
//             text: 'Хочу покушац',
//             callback_data: 'morePes'
//         }
//     ],
// ]; //конфиг клавиатуры
// bot.on('callback_query', (query) => {
//     const chatId = query.message.chat.id;
//
//     let img = '';
//
//     if (query.data === 'moreKeks') { // если кот
//         img = 'https://wallpapersgood.ru/wallpapers/main/201116/67ef50a1bbd05397b592e4becebdd773.jpg';
//     }
//
//     if (query.data === 'morePes') { // если пёс
//         img = 'https://shaurmist46.ru/wp-content/uploads/2020/11/2560x1600_996539_www.ArtFile.ru_-1536x960.jpg';
//     }
//
//     if (img) {
//         bot.sendPhoto(chatId, img, { // прикрутим клаву
//             reply_markup: {
//                 inline_keyboard: keyboard
//             }
//         });
//     } else {
//         bot.sendMessage(chatId, 'Непонятно, давай попробуем ещё раз?', { // прикрутим клаву
//             reply_markup: {
//                 inline_keyboard: keyboard
//             }
//         });
//     }
// }); // обработчик событий нажатий на клавиатуру