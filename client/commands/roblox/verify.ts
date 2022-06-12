import { Command } from "../../config/events.d.ts";
import { CreateUser } from "../../db/src.ts";
import { Harmony, Denblox } from "../../config/deps.ts";

const Command: Command = {
	name: "verify",
	description: "Verify your roblox account",
	options: [
		{
			name: "username",
			description: "The account to verify",
			required: true,
			type: "STRING",
		},
	],
	script: async (client, slash, db) => {
		if (!client.user || !slash.guild || !slash.member) return;

		const username: string = slash.option("username");
		try {
			const user = await Denblox.getUserByName(username).catch(() => {});
			if (!user)
				return await slash.reply("Please provide a valid username!", { ephemeral: true });

			const group = await Denblox.getUserInGroup("14744332", user.id).catch(() => {});

			const code = Math.random()
				.toString(36)
				.substring(2, 10 + 2);

			const embed = new Harmony.Embed({
				author: { name: "Strombré Interactions", icon_url: client.user.avatarURL() },
				title: `Welcome, ${user.name}`,
				description: `Welcome to **Strombre's Verification**\nThis is a short and easy process; to finish, simply enter the code below into your account description!\n\n\`\`\`${code}\`\`\``,
				thumbnail: { url: user.thumbnails.headshot },
				footer: { text: "This prompt will end in 2 minutes." },
			});

			await slash.respond({
				embeds: [embed],
				components: [
					{
						type: "ACTION_ROW",
						components: [
							{
								type: "BUTTON",
								label: "DONE",
								customID: "done",
								style: "GREY",
							},
							{
								type: "BUTTON",
								label: "CANCEL",
								customID: "cancel",
								style: "RED",
							},
						],
					},
				],
				ephemeral: true,
			});

			const collector = new Harmony.Collector({
				max: 1,
				timeout: 120000,
				event: "interactionCreate",
				filter: (i: Harmony.Interaction) =>
					i.isMessageComponent() &&
					["done", "cancel"].includes(i.customID) &&
					i.user.id === slash.user.id,
			});

			collector.init(client);
			collector.collect();

			collector.on("collect", async (collected: Harmony.Interaction) => {
				if (!collected.isMessageComponent()) return;
				if (collected.customID === "cancel") {
					return collected.updateMessage({
						components: [],
						embeds: [],
						content: "Successfully cancelled this prompt",
					});
				}

				const checker = await Denblox.getUser(user.id);
				if (code !== checker.description.replaceAll(" ", "")) {
					return collected.updateMessage({
						components: [],
						embeds: [],
						content: "Your status doesn't match the code, please retry this verify prompt!",
					});
				}

				embed.setDescription(
					`Thank you for authenticating your account. \n\nYou will be assigned roles; if any roles are missing, please use \`/update\`.`,
				);

				embed.addField({
					name: "Roles Added",
					value: group ? group.role.name : "Guest",
				});
				embed.setFooter("");
				slash.editResponse({ embeds: [embed], components: [] });

				slash.member?.setNickname(checker.name).catch(() => {});

				const collection = await slash.guild?.roles.collection();
				const role = group
					? collection?.find((role) => role.name === group.role.name)
					: collection?.find((role) => role.name === "Guest");

				if (role) await slash.member?.roles.add(role).catch(() => {});

				const verified = collection?.find((role) => role.name === "Verified");
				if (verified) slash.member?.roles.add(verified).catch(() => {});
				return CreateUser(
					slash.member!,
					{ username: user.name, rid: user.id, role: group ? group.role.name : "Guest" },
					db,
				);
			});
		} catch (_) {
			console.error(_);
			return slash.reply("Something went wrong with this interaction!").catch(() => {});
		}
	},
};

export default Command;
