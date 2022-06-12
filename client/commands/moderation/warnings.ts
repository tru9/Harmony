import { Command } from "../../config/events.d.ts";
import { Harmony } from "../../config/deps.ts";
import { Infraction, UserSchema } from "../../db/src.ts";

const source: Command = {
	name: "warnings",
	description: "View a specified member's warnings",
	options: [
		{
			name: "member",
			description: "The member to view's warnings",
			required: true,
			type: "USER",
		},
	],
	script: async (_, slash, db) => {
		if (!slash.member) return;

		const member = (slash.option("member") as Harmony.InteractionUser).member;
		if (!member || member.user.bot)
			return await slash.reply("Please provide a valid member!", { ephemeral: true });

		// database
		const collection = db.database("Strombre").collection<UserSchema>("users");
		const user = await collection.findOne({ id: member.user.id }).catch(() => {});

		if (!user)
			return await slash.reply("This member is not verified!", { ephemeral: true });

		// infractions
		if (!user.infractions)
			return await slash.reply("This member has no infractions!", { ephemeral: true });

		let infractions: Infraction[][] = [];

		for (let i = 0; i < user.infractions.length; i += 3) {
			const element = user.infractions[i];
			infractions.push([element, user.infractions[i + 1], user.infractions[i + 2]]);
		}

		infractions = infractions.map((arr) => arr.filter((v) => v));

		//dm
		await slash.reply("Please check your direct messages!", { ephemeral: true });
		const embed = new Harmony.Embed({
			author: { name: `${member.user.username}'s Warnings`, icon_url: _.user?.avatarURL() },
			footer: { text: `Page 1/${infractions.length}` },
		});

		let id = 0;
		let page = 0;
		infractions[0].forEach((element) => {
			if (!element) return;
			id++;

			Warnings(embed, element, id);
		});

		const msg = await slash.user
			.send({
				embeds: [embed],
				components:
					infractions.length > 1
						? [
								{
									type: "ACTION_ROW",
									components: [
										{
											type: "BUTTON",
											label: "⬅️ Back",
											customID: "back",
											style: "GREY",
										},
										{
											type: "BUTTON",
											label: "➡️ Next",
											customID: "next",
											style: "GREY",
										},
										{
											type: "BUTTON",
											label: "❌ Stop",
											customID: "stop",
											style: "GREY",
										},
									],
								},
						  ]
						: [],
			})
			.catch(() =>
				slash
					.editResponse({
						content: "Please check your privacy settings and try again!",
						ephemeral: true,
					})
					.catch(() => {}),
			);

		if (infractions.length <= 1 || !msg) return;
		const collector = new Harmony.Collector({
			timeout: 120000,
			event: "interactionCreate",
			filter: (i: Harmony.Interaction) =>
				i.isMessageComponent() &&
				i.message.id === msg.id &&
				["next", "stop", "back"].includes(i.customID) &&
				slash.user.id === i.user.id,
		});

		collector.init(_);
		collector.collect();

		collector.on("collect", (collected: Harmony.Interaction) => {
			if (!collected.isMessageComponent()) return;

			if (collected.customID === "stop") {
				collector.end();
				return collected
					.updateMessage({
						components: [],
					})
					.catch(() => {});
			}

			if (collected.customID === "next") {
				page !== infractions.length ? page++ : (page = infractions.length);

				if (page >= infractions.length) {
					return collected
						.updateMessage({ content: `${member.user}'s Infractions` })
						.catch(() => {});
				}
			}

			if (collected.customID === "back") {
				page !== 0 ? page-- : (page = 0);

				if (page < 0) {
					return collected
						.updateMessage({ content: `${member.user}'s Infractions` })
						.catch(() => {});
				}
			}

			embed.fields = [];
			const info = infractions[page];
			if (!info) return;

			info.forEach((data) => {
				if (!data) return;
				id++;
				Warnings(embed, data, user.infractions!.indexOf(data) + 1);
			});

			embed.setFooter(
				`Page ${infractions.indexOf(info) === 0 ? 1 : infractions.indexOf(info) + 1}/${
					infractions.length
				}`,
			);

			collected
				.updateMessage({ content: `${member.user}'s Infractions`, embeds: [embed] })
				.catch(() => {});
		});
	},
};
export default source;

function Warnings(embed: Harmony.Embed, element: Infraction, id: number) {
	const date = element.DateToUnban
		? `${element.date.toDateString()} to ${element.DateToUnban.toDateString()}`
		: element.date.toDateString();

	embed.addFields({
		name: `Infraction ${id}`,
		//prettier-ignore
		value: `ID: \`${element.id}\`\nType: \`${element.type}\`\nReason: **${element.reason}**\nModerator: <@${element.moderator}>\n Date: \`${date}\``,
	});

	return;
}
