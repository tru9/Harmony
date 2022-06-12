import { Harmony, Denblox as denblox } from "../../config/deps.ts";
import { Command } from "../../config/events.d.ts";
import { UserSchema } from "../../db/src.ts";
import { AddRoles } from "./helper/member.ts";
import { ModerationEmbed } from "../moderation/helper/embed.ts";

const src: Command = {
	name: "promote",
	description: "Promote the specified member",
	options: [
		{ name: "member", description: "The member to promote", type: "USER", required: true },
	],

	script: async (_, slash, db) => {
		if (!slash.member) return;

		const member = (slash.option("member") as Harmony.InteractionUser).member;
		if (!member || member === slash.member || member.user.bot)
			return await slash.reply("Please provide a valid member", { ephemeral: true });

		// database
		const collection = db.database("Strombre").collection<UserSchema>("users");
		const user = await collection.findOne({ id: member.id }).catch(() => {});
		if (!user) return await slash.reply("This member is not verified", { ephemeral: true });

		// group management
		const groupID = "14744332";
		const user_rank = await denblox.getUserInGroup(groupID, user.rid).catch(() => {});
		const group = await denblox.getGroup(groupID);

		if (!user_rank)
			return await slash.reply("This member is not in the group", { ephemeral: true });

		// role management
		const old_rank = group.roles.find((value) => value.rank === user_rank.role.rank)!;
		const new_rank = group.roles[group.roles.indexOf(old_rank) + 1];

		if (new_rank.name.toLowerCase() === "management intern")
			return await slash.reply("This member has reached the maximum promotions!", {
				ephemeral: true,
			});

		await denblox.promote(groupID, user.rid);
		await AddRoles(slash, member, { old: old_rank.name, new: new_rank.name }).catch(
			async () => {
				await denblox.demote(groupID, user.rid);
				return await slash.reply("Something went wrong with this interaction!", {
					ephemeral: true,
				});
			},
		);

		const Embed = ModerationEmbed(
			_,
			"Promote",
			`A member has been promoted by ${slash.user}`,
		);

		Embed.addFields(
			{
				name: "__Member Promoted__",
				value: `Member: ${member.user}`,
			},
			{
				name: "__Roblox Information__",
				value: `Old Rank: \`${old_rank.name}\`\nNew Rank: \`${new_rank.name}\``,
			},
		);

		const logs = await slash.guild?.channels.fetch(Deno.env.get("LOG"));
		if (logs?.isText()) logs.send({ embeds: [Embed] }).catch(() => {});
		// promotion via DB
		await collection.updateOne(user, { $set: { role: new_rank.name } });
		return await slash.reply("Successfully promoted this member!", { ephemeral: true });
	},
};
export default src;
