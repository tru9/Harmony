import { Harmony as H } from "../../config/deps.ts";
import { Command } from "../../config/events.d.ts";
import { UserSchema, Infraction } from "../../db/src.ts";
import { ModerationEmbed } from "./helper/embed.ts";

const script: Command = {
	name: "warn",
	description: "Warn a specified member",
	options: [
		{
			name: "user",
			type: "USER",
			required: true,
			description: "The member to warn",
		},
		{
			name: "reason",
			type: "STRING",
			required: true,
			description: "The reason to warn this member",
		},
	],
	script: async (_, slash, mongodb) => {
		if (!slash.member) return;

		const member = (slash.option("user") as H.InteractionUser).member;
		const reason = slash.option("reason") as string;

		//prettier-ignore
		if (!member || member.user.bot || !await member.kickable(slash.member) || slash.member === member)
			return await slash.reply("You cannot warn this member!", { ephemeral: true });

		if (!reason || /^[\w\W]{1,10}$/g.test(reason))
			// prettier-ignore
			return await slash.reply("Please provide a valid reason!", { ephemeral: true });

		const database = mongodb.database("Strombre").collection<UserSchema>("users");
		if (!(await database.findOne({ id: member.id })))
			return await slash.reply("This member is not verified!", { ephemeral: true });

		const id = Math.floor(Math.random() * 100000).toString();
		const warning: Infraction = {
			id,
			type: "warn",
			reason,
			moderator: slash.user.id,
			date: new Date(),
		};

		await database.updateOne(
			{ id: member.id },
			{ $push: { infractions: { $each: [warning] } } },
		);

		// prettier-ignore
		member.user
			.send(`You have been warned by: <@${slash.user.id}> for \`${reason}\`J`)
			.catch(() => {});

		const Embed = ModerationEmbed(_, "Warn", `A member has been warned by ${slash.user}`);

		Embed.addFields(
			{
				name: "__Member Warned__",
				value: `Member: ${member.user}`,
			},
			{
				name: "__Warn Information__",
				value: `ID: \`${id}\`\n Reason: \`${reason}\``,
			},
		);

		const logs = await slash.guild?.channels.fetch(Deno.env.get("LOG"));
		if (logs?.isText()) logs.send({ embeds: [Embed] }).catch(() => {});

		return await slash.reply("Successfully warned the member", { ephemeral: true });
	},
};
export default script;
