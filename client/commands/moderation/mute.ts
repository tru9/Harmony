import { Command } from "../../config/events.d.ts";
import { Harmony, ms } from "../../config/deps.ts";
import { ModerationEmbed } from "./helper/embed.ts";

const Command: Command = {
	name: "mute",
	description: "Mute the specified for a specific length",
	options: [
		{
			name: "user",
			description: "The user to mute",
			required: true,
			type: "USER",
		},
		{
			name: "reason",
			description: "The reason to mute this user",
			required: true,
			type: "STRING",
		},
		{
			name: "length",
			description: "The length to mute this user",
			required: true,
			type: "STRING",
		},
	],
	script: async (client, slash) => {
		if (!client || !slash.guild) return;

		const user = slash.option("user") as Harmony.InteractionUser;
		const reason = slash.option("reason") as string;

		const length = slash.option("length") as string;

		try {
			const member = user.member;
			if (!member)
				return await slash.reply("You can only mute users within this server!", {
					ephemeral: true,
				});

			if (
				member.user === slash.user ||
				member.user.bot ||
				!(await member.kickable(slash.member))
			)
				return await slash.reply("You cannot mute this member!", { ephemeral: true });

			if (!reason || /^[\w\W]{1,10}$/g.test(reason))
				return await slash.reply("Please provide a valid reason!", { ephemeral: true });

			if (!length || !/^((\d){1,2}(d|hrs|m|h)){1,3}$/g.test(length))
				return await slash.reply("Please provide a valid mute length!", { ephemeral: true });

			const MuteTime = ms(length) as number;
			if (MuteTime > 9e7)
				return await slash.reply("You cannot mute this member for over **24 hours**!", {
					ephemeral: true,
				});

			await member.edit({ communicationDisabledUntil: new Date(Date.now() + MuteTime) });
			const LongLength = ms(ms(length)!, {
				long: true,
			});

			member.user
				.send(
					`You have been muted by: <@${slash.user.id}> for: \`${reason}\`\n\n***You will be unmuted in ${LongLength}***`,
				)
				.catch(() => {});

			await slash.reply("Successfully muted this member!", { ephemeral: true });
			const Embed = ModerationEmbed(
				client,
				"Mute",
				`A member has been muted by ${slash.user}`,
			);

			Embed.addFields(
				{
					name: "__Member Muted__",
					value: `Member: ${member.user}`,
				},
				{
					name: "__Mute Information__",
					value: `Length: \`${LongLength}\`\nReason: \`${reason}\``,
				},
			);

			const logs = await slash.guild.channels.fetch(Deno.env.get("LOG"));
			if (logs?.isText()) logs.send({ embeds: [Embed] });

			return;
		} catch (_) {
			console.error(_);
			return slash.reply("Something went wrong with this interaction!").catch(() => {});
		}
	},
};

export default Command;
