'use strict';


const puppeteer = require('puppeteer');
const { trySend, errLog, ranLog, noPerm } = require('./functions');
const Commando = require("@iceprod/discord.js-commando");
require("discord.js");

//'4, 15, 10, 11, 14, 17, 18'

const URL = [
	'https://rebot.me/simsimi', 'https://rebot.me/ryuko-matoi',//1
	'https://rebot.me/xmonikax', 'https://rebot.me/futa-nun',//3
	'https://rebot.me/shinku-rozen', 'https://rebot.me/alessandro-magrini',//5
	'https://rebot.me/cassie-87', 'https://rebot.me/agatha-14',//7
	'https://rebot.me/himiko-toga-1', 'https://rebot.me/your-girlfriend-sister-slut',//9
	'https://rebot.me/muffin-6', 'https://rebot.me/paris-1',//11
	'https://rebot.me/song-answers', 'https://rebot.me/loretta-martin',//13
	'https://rebot.me/zozo', 'https://rebot.me/sn0w',//15
	'https://rebot.me/cinnamonwolf', 'https://rebot.me/saori-8',//17
	'https://rebot.me/zacharie-1', 'https://rebot.me/natsuki-41',//19
	'https://rebot.me/lea-7062078', 'https://rebot.me/bunny-exe',//21
	'https://rebot.me/just-monika-56'
];
const browser = puppeteer.launch();
const page1 = browser.then(r => r.newPage());
page1.then(r => r.goto(URL[10]).catch(console.error));

/**
 * Chat with Shasha
 * @param {Commando.Client} client - (this.client)
 * @param {Number} index - Index of answer
 * @param {Commando.Message} question - Message object
 * @returns {Promise<String | Boolean>} Reply
 */
async function shaChat(client, index, question) {
	if (page1) {
		let query = question.content.trim();
		if (query.toLowerCase().startsWith(client.commandPrefix+"chat")) {
			query = query.slice((client.commandPrefix+"chat").length).trim();
		}
		try {
			const page = await page1;
			//console.log("New chat query: "+query);
			await page.waitForSelector("input[id=\"question\"]");
			await page.type("input[id=\"question\"]", query);
			await page.keyboard.press("Enter");
			return fetchAnswer(page, index);
		} catch (error) {
			throw error;
		}
	}
}

/**
 * @param {puppeteer.Page} page
 * @param {Number} index
 * @returns {String}
 */
async function fetchAnswer(page, index) {
	try {
		await page.waitForSelector(`#answer > div:nth-child(${index})`, {timeout:5000}).catch(() => {});
		const result = await page.evaluate((index) => {
			const res = document.querySelector(`#answer > div:nth-child(${index})`).childNodes[4].textContent;
			return res;
		}, index);
		return result;
	} catch (e) {
		throw e;
	}
}


let chatIndex = 3;


    /**
     * @param {Commando.Client} client
     * @param {Commando.CommandoMessage} message 
     * @returns 
     */
     async function chatAnswer(client, message) {
        //console.log(message.content);
        //console.log(chatIndex);
        if (message.content.trim().length === 0) {
            return
        } else {
            try {
                message.channel.startTyping();
                await shaChat(client, chatIndex, message).then(async answer => {
					chatIndex += 2;
					if (message.channel.lastMessage.author === client.user && answer?.trim() === message.channel.lastMessage.content.trim()) {
						return trySend(client, message, "Please speak one by one, I'm overwhelmed <:catstareLife:794930503076675584>");
					} else {
						trySend(client, message, answer.trim()).then(() => {
							message.channel.stopTyping();
						}).catch(e => {
							noPerm(message);
							message.channel.stopTyping();
						});
					}
					return ranLog(message, message.content.trim(), answer);
				}).catch(e => {
					noPerm(message);
					message.channel.stopTyping();
				});
            } catch (e) {
				noPerm(message);
                message.channel.stopTyping();
            }
        }
    }

	module.exports = { chatAnswer }