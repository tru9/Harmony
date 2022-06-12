import { Harmony } from "../../config/deps.ts";
import { Command as CMD } from "../../config/events.d.ts";
import { UserSchema, Infraction } from "../../db/src.ts";
import { ModerationEmbed } from "./helper/embed.ts";

const Command: CMD = {
	name: "ban",
	description: "Ban a supplied member",
	options: [
		{
			name: "member",
			type: "USER",
			description: "The member to ban",
			required: true,
		},
		{
			name: "reason",
			type: "STRING",
			description: "The reason to ban this member",
			required: true,
		},
		{
			type: "STRING",
			required: true,
			name: "ban-length",
			description: "The length to ban this member for",
			choices: [
				{
					name: "5 Days",
					value: new Date(Date.now() + 4.32e8),
				},
				{
					name: "7 Days",
					value: new Date(Date.now() + 6.048e8),
				},
				{
					name: "Permanently",
					value: "perm",
				},
			],
		},
	],
	script: async (_client, slash, mongo) => {
		if (!slash.guild || !slash.member) return;

		const member = (slash.option("member") as Harmony.InteractionUser).member;
		const reason = slash.option("reason") as string;
		const BanLength = slash.option("ban-length") as string;

		try {
			// prettier-ignore
			if (!member || member === slash.member || !await member?.bannable(slash.member) || member.user.bot)
				return await slash.reply("You cannot ban this member!", { ephemeral: true });

			if (!reason || /^[\w\W]{1,10}$/g.test(reason))
				return await slash.reply("Please provide a valid reason!", { ephemeral: true });

			const msg = BanLength.includes("-")
				? // prettier-ignore
				  `\n\n***You will be unbanned at ${new Date(BanLength).toLocaleDateString()}***`
				: "";

			const id = Math.floor(Math.random() * 100000).toString();

			// prettier-ignore
			await member.user.send(`You have been banned in **${slash.guild.name}** for \`${reason}\`\nIf you feel as this ban is a mistake, please contact <@172895027800834048>.${msg}`).catch(() => {});
			await member.ban(reason, 7);

			const database = mongo.database("Strombre").collection<UserSchema>("users");
			if (!(await database.findOne({ id: member.user.id })))
				return await slash.reply("This member is not verified!", { ephemeral: true });

			const infraction: Infraction = {
				id,
				type: "ban",
				reason,
				moderator: slash.user.id,
				date: new Date(),
			};

			if (BanLength.includes("-")) infraction.DateToUnban = new Date(BanLength);

			database
				.updateOne(
					{
						id: member.user.id,
					},
					{
						$push: { infractions: { $each: [infraction] } },
					},
				)
				.catch(() => {});

			const Embed = ModerationEmbed(
				_client,
				"Ban",
				`A member has been banned by ${slash.user}`,
			);

			Embed.addFields(
				{
					name: "__Member Banned__",
					value: `Member: ${member.user}`,
				},
				{
					name: "__Ban Information__",
					value: `Reason: \`${reason}\`\nLength: \`${
						BanLength.includes("-") ? new Date(BanLength).toLocaleDateString() : BanLength
					}\``,
				},
			);

			const logs = await slash.guild.channels.fetch(Deno.env.get("LOG"));
			if (logs?.isText()) logs.send({ embeds: [Embed] }).catch(() => {});

			return await slash.reply("Successfully banned this member!", { ephemeral: true });
		} catch (_) {
			console.error(_);
			return slash.reply("Something went wrong with this interaction!").catch(() => {});
		}
	},
};

export default Command;
