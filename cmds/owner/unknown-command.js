const { trySend } = require('../../resources/functions');
const { chatAnswer } = require('../../resources/shaChat');
const Command = require('../../node_modules/@iceprod/discord.js-commando/src/commands/base');

module.exports = class UnknownCommandCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'unknown-command',
			group: 'owner',
			memberName: 'unknown-command',
			description: 'Displays help information for when an unknown command is used.',
			examples: ['unknown-command kickeverybodyever'],
			unknown: true,
			hidden: true
		});
	}

	// eslint-disable-next-line
	async run(msg) {
		if (msg.guild && !msg.member.hasPermission("MANAGE_MESSAGES")) return;
		if (new RegExp("^<@\!?" + msg.client.user.id + ">.").test(msg.content)) {
			msg.channel.startTyping();
			const s = msg.cleanContent.slice((msg.guild ? msg.guild.member(msg.client.user).displayName.length : msg.client.user.username.length) + 2).trim();
			return trySend(msg.client, msg, await chatAnswer(s));
		}
		if (!msg.guild && !msg.content.toLowerCase().startsWith(msg.client.commandPrefix)) {
			msg.channel.startTyping();
			return trySend(msg.client, msg, await chatAnswer(msg.cleanContent));
		};
		try {
			return await msg.channel.send(
				`Unknown command \`${msg.content}\`. Use ${msg.anyUsage(
					'help',
					msg.guild ? undefined : null,
					msg.guild ? undefined : null
				)} to view the command list.`
			);
			// eslint-disable-next-line
		} catch (exception) { }
	}
};
