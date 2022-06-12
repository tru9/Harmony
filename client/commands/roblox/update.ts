import { Harmony, Denblox as denblox } from "../../config/deps.ts";
import { Command } from "../../config/events.d.ts";
import { UserSchema } from "../../db/src.ts";
import { AddRoles } from "./helper/member.ts";

const script: Command = {
	name: "update",
	description: "Sync your roblox account",
	options: [
		{
			name: "member",
			description: "The member to update manually",
			type: "USER",
		},
	],
	script: async (_, slash, db) => {
		if (!slash.member) return;

		const mOption = slash.option("member") as Harmony.InteractionUser;
		const member = mOption?.member || slash.member;

		const option = mOption && mOption?.member !== slash.member;
		// database management
		const collection = db.database("Strombre").collection<UserSchema>("users");
		const user = await collection.findOne({ id: member.id }).catch(() => {});

		if (user?.id) {
			const guildMember = await slash.guild?.members.resolve(user.id).catch(() => {});
			if (
				slash.option("member") &&
				!(await guildMember?.kickable(slash.member)) &&
				member.id !== slash.member.id
			)
				return await slash.reply("You cannot update this member!", { ephemeral: true });
		}

		if (!user)
			return await slash.reply(
				`${option ? "They" : "You"} are not verified, ${
					option ? "please have them verify" : "please verify your account"
				} `,
				{
					ephemeral: true,
				},
			);

		// roblox account
		const account = await denblox.getUser(user.rid).catch(() => {});
		if (!account)
			return await slash.reply(`${option ? "They" : "You"} are not verified!`, {
				ephemeral: true,
			});
		const group = await denblox.getUserInGroup("14744332", account.id).catch(() => {});

		if (!group)
			return await slash.reply(
				`${option ? "They" : "You"} are not verified, ${
					option ? "please have them verify" : "please verify your account"
				} `,
				{
					ephemeral: true,
				},
			);

		// ranking
		if (group.role.name.toLowerCase() === user.role.toLowerCase())
			return await slash.reply("There is nothing to update!", { ephemeral: true });

		await AddRoles(slash, member, { old: user.role, new: group.role.name });
		await collection
			.updateOne(user, { $set: { role: group.role.name } })
			.catch(async () => {
				await AddRoles(slash, member!, { old: group.role.name, new: user.role });
				throw "failed to update role";
			});

		const embed = new Harmony.Embed({
			author: { name: "Strombre Interactions", icon_url: _.user?.avatarURL() },
			title: `✅ Successfully Updated`,
			description: ` ${
				option ? "They have been" : "You have"
			}successfully updated your roles\n\nIf any roles are missing please rerun this command.`,
			fields: [
				{
					name: "Roles Added",
					value: group.role?.name || "Guest",
				},
				{
					name: "Roles Removed",
					value: user.role || "Guest",
				},
			],
		});

		return await slash.reply({ embeds: [embed], ephemeral: true });
	},
};
export default script;
