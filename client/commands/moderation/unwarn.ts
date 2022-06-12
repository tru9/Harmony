import { Harmony } from "../../config/deps.ts";
import { Command } from "../../config/events.d.ts";
import { UserSchema } from "../../db/src.ts";
import { ModerationEmbed } from "./helper/embed.ts";

const script: Command = {
	name: "unwarn",
	description: "Unwarn a specified member",
	options: [
		{
			name: "member",
			description: "The member to unwarn",
			type: "USER",
			required: true,
		},
		{
			name: "reason",
			description: "The reason to unwarn this member",
			type: "STRING",
			required: true,
		},
		{
			name: "id",
			description: "The ID of the warning",
			type: "STRING",
			required: true,
		},
	],

	script: async (_, slash, db) => {
		if (!slash.member) return;

		const member = (slash.option("member") as Harmony.InteractionUser).member;
		const reason = slash.option("reason") as string;
		const id = slash.option("id") as string;

		if (!member || member.user.bot || slash.member === member)
			return await slash.reply("You cannot unwarn this member");

		if (!reason || /^[\w\W]{1,10}$/g.test(reason))
			return await slash.reply("Please provide a valid reason", { ephemeral: true });

		// database
		const collection = db.database("Strombre").collection<UserSchema>("users");
		const user = await collection
			.findOne({ id: member.id, infractions: { $elemMatch: { id, type: "warn" } } })
			.catch(() => {});

		if (!user)
			return await slash.reply("This user doesn't have a warning with that ID", {
				ephemeral: true,
			});

		// unwarn
		await collection.updateOne({ id: member.id }, { $pull: { infractions: { id } } });

		// logs
		const Embed = ModerationEmbed(
			_,
			"Unwarn",
			`A member has been unwarned by ${slash.user}`,
		);

		Embed.addFields(
			{
				name: "__Member Unwarned__",
				value: `Member: ${member.user}`,
			},
			{
				name: "__Unwarn Information__",
				value: `ID: \`${id}\`\nReason: \`${reason}\``,
			},
		);

		const logs = await slash.guild?.channels.fetch(Deno.env.get("LOG"));
		if (logs?.isText()) logs.send({ embeds: [Embed] }).catch(() => {});

		return await slash.reply("This member has been unwarned", { ephemeral: true });
	},
};
export default script;
