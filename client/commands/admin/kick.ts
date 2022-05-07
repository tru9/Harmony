import { Command } from "../../config/events.d.ts";
import { Harmony } from "../../config/deps.ts";

const Command: Command = {
	name: "kick",
	description: "Kick a supplied member from the server",
	options: [
		{
			name: "member",
			type: "USER",
			description: "The member to kick",
			required: true,
		},
		{
			name: "reason",
			type: "STRING",
			description: "The reason to kick this member",
			required: true,
		},
	],
	script: (client, slash) => {
		if (!client || !slash) return;

		const member = slash.option("member") as Harmony.InteractionUser;
		const reason = slash.option("reason") as string;

		try {
			if (member === slash.user || member.bot)
				return slash.reply(`You cannot kick this member!`, { ephemeral: true });

			if (/^[\w\W]{1,4}$/gm.test(reason) || !reason)
				return slash.reply("Please provide a longer reason!", { ephemeral: true });
		} catch (_) {
			console.error(_);
			slash.reply("Something went wrong with this interaction!").catch(() => {});
		}
	},
};

export default Command;
