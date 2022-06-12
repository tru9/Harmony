import { Command } from "../../config/events.d.ts";
import { Harmony } from "../../config/deps.ts";
import { ModerationEmbed } from "./helper/embed.ts";

const Command: Command = {
	name: "unmute",
	description: "Unmute a specified member",
	options: [
		{
			name: "member",
			description: "The member to unmute",
			required: true,
			type: "USER",
		},
		{
			name: "reason",
			description: "The reason to unmute the member",
			required: true,
			type: "STRING",
		},
	],
	script: async (client, slash) => {
		if (!client || !slash.guild) return;

		const user = slash.option("member") as Harmony.InteractionUser;
		const reason = slash.option("reason") as string;

		try {
			const member = user.member;
			if (!member)
				return await slash.reply("You can only unmute users within this server!", {
					ephemeral: true,
				});

			if (member.user === slash.user || member.user.bot || !member.kickable(slash.member))
				return await slash.reply("You cannot unmute this member!", {
					ephemeral: true,
				});

			if (!reason || /^[\w\W]{1,10}$/g.test(reason))
				return await slash.reply("Please provide a valid reason!", {
					ephemeral: true,
				});

			await member.edit({
				communicationDisabledUntil: new Date(),
			});

			member.user.send(`You have been unmuted by: ${slash.user}`).catch(() => {});
			await slash.reply("Successfully unmuted this member!", { ephemeral: true });

			const Embed = ModerationEmbed(
				client,
				"Unmute",
				`A member has been unmuted by ${slash.user}`,
			);

			Embed.addFields(
				{
					name: "__Member Unmuted__",
					value: `Member: ${member.user}`,
				},
				{
					name: "__Unmute Information__",
					value: `Reason: \`${reason}\``,
				},
			);

			const logs = await slash.guild.channels.fetch(Deno.env.get("LOG"));
			if (logs?.isText()) logs.send({ embeds: [Embed] }).catch(() => {});

			return;
		} catch (_) {
			console.error(_);
			return slash.reply("Something went wrong with this interaction!").catch(() => {});
		}
	},
};

export default Command;
