import { Command } from "../../config/events.d.ts";
import { Harmony, Denblox } from "../../config/deps.ts";

const Command: Command = {
	name: "rbxwhois",
	description: "Get information about a Roblox User",
	options: [
		{
			type: "STRING",
			name: "username",
			description: "The username of the Roblox account",
			required: true,
		},
	],
	script: async (client, slash) => {
		if (!client.user || !slash) return;

		const username = slash.option("username") as string;
		try {
			const account = await Denblox.getUserByName(username).catch(() => {});
			if (!account)
				return slash.reply(`I wasn't able to get the account: \`${username}\`!`, {
					ephemeral: true,
				});

			const Embed = new Harmony.Embed({
				author: { name: "Strombré Interactions", icon_url: client.user.avatarURL() },
				title: account.name,
				url: `https://www.roblox.com/users/${account.id}/profile`,
				thumbnail: { url: account.thumbnails.headshot },
				footer: { text: `Requested by ${slash.user.tag}` },
			});

			const inGroup = await Denblox.getUserInGroup(14744332, account.id).catch(() => {});
			if (inGroup)
				Embed.addField({
					name: "Group Role",
					value: inGroup.role.name || "Couldn't find the role!",
				});

			Embed.addFields(
				{
					name: "Account Description",
					value: account.description || "No description available",
				},
				{
					name: "Account Created Date",
					value: account.created.toLocaleString(),
				},
			);

			if (account.isBanned) Embed.addField({ name: "Account Status", value: "Banned" });
			return slash.reply({ embeds: [Embed] });
		} catch (_) {
			console.error(_);
			return slash.reply("Something went wrong with this interaction!").catch(() => {});
		}
	},
};

export default Command;
