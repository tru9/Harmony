import { Command } from "../../config/events.d.ts";
import { Harmony } from "../../config/deps.ts";

const Command: Command = {
	name: "whois",
	description: "Get information of a supplied discord user",
	options: [
		{
			name: "user",
			type: "USER",
			description: "The user to get information about",
		},
	],
	script: async (client, slash) => {
		if (!client.user || !slash.guild) return;

		const user = (slash.option("user") as Harmony.InteractionUser) || slash.user;

		const FetchedUser = await client.users.fetch(user.id);
		const GuildUser = await slash.guild.members.fetch(FetchedUser.id).catch(() => {});

		const Embed = new Harmony.Embed({
			author: { name: "Strombré Interactions", icon_url: client.user.avatarURL() },
			title: FetchedUser.tag,
			thumbnail: { url: FetchedUser.avatarURL("png") },
			footer: { text: `Requested by ${slash.user.tag}` },
		});

		const fields: Harmony.EmbedField[] = [
			{
				name: "User ID",
				value: FetchedUser.id,
			},
			{
				name: "Username",
				value: FetchedUser.username,
			},
			{
				name: "Created At",
				value: new Date(FetchedUser.snowflake.timestamp).toLocaleString(),
			},
		];

		if (GuildUser)
			fields.push(
				{
					name: "Join Date",
					value: new Date(GuildUser.joinedAt).toLocaleString(),
				},
				{
					name: "User Roles",
					value: (await GuildUser.roles.collection())
						.map((role) => `<@&${role.id}>`)
						.slice(1)
						.join(", "),
				},
			);

		Embed.addFields(...fields);
		return await slash.reply({ embeds: [Embed] });
	},
};

export default Command;
