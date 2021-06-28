'use strict';

const axios = require("axios").default;

//'4, 15, 10, 11, 14, 17, 18'

/*
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
*/

async function chatAnswer(message) {
	// return axios.post("https://rebot.me/ask", { username: "simsimi", question: message }).then(r => r.data).catch(() => { });
	console.log(message);
	const u = message.replace(/( |\n|\t)+/g, "+").slice(0, 1000);
	console.log(u);
	return axios.get(`https://api.simsimi.net/v1/?text=${u}&lang=en`).then(r => {
		console.log(r.data);
		return r.data.success.replace(/Sim doesn't know what you are talking about. Please teach me/, "Sorry but i don't speak gibberish");
	}).catch(() => { });
}

module.exports = { chatAnswer }
