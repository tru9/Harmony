import { Harmony as H } from "../../config/deps.ts";
import { Command } from "../../config/events.d.ts";
import { UserSchema } from "../../db/src.ts";
import { ModerationEmbed } from "./helper/embed.ts";

const src: Command = {
	name: "unban",
	description: "Unban a user from the server",
	options: [
		{
			name: "user",
			description: "The user to unban",
			required: true,
			type: "USER",
		},
		{
			name: "reason",
			description: "The reason to unban this user",
			required: true,
			type: "STRING",
		},
	],
	script: async (_c, slash, db) => {
		if (!slash.member) return;

		const user: H.InteractionUser = slash.option("user");
		const reason: string = slash.option("reason");

		try {
			const BannedUser = await slash.guild!.bans.get(user.id).catch(() => {});
			if (!BannedUser)
				return await slash.reply("This user is not banned", { ephemeral: true });

			if (!reason || /^[\w\W]{1,10}$/g.test(reason))
				return await slash.reply("Please provide a valid reason!", { ephemeral: true });

			await slash.guild!.bans.remove(BannedUser.user, reason);
			const users = db.database("Strombre").collection<UserSchema>("users");

			if ((await users.findOne({ id: BannedUser.user.id }))?.infractions) {
				await users
					.updateOne(
						{ id: user.id },
						{
							$pull: { infractions: { reason: BannedUser.reason } },
						},
					)
					.catch(() => {});
			}

			const Embed = ModerationEmbed(_c, "Unban", `A member has been unban by ${slash.user}`);

			Embed.addFields(
				{
					name: "__Member Unbanned__",
					value: `Member: ${BannedUser.user}`,
				},
				{
					name: "__Unban Information__",
					value: `Reason: \`${reason}\``,
				},
			);

			const logs = await slash.guild?.channels.fetch(Deno.env.get("LOG"));
			if (logs?.isText()) logs.send({ embeds: [Embed] }).catch(() => {});

			return await slash.reply(`Successfully unbanned <@${BannedUser.user.id}>`, {
				ephemeral: true,
			});
		} catch (_) {
			console.error(_);
			return slash.reply("Something went wrong with this interaction!").catch(() => {});
		}
	},
};
export default src;
