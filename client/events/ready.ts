import { Denblox, Harmony, MongoClient } from "../config/deps.ts";
import { Event, Command } from "../config/events.d.ts";
import { UserSchema } from "../db/src.ts";

const Event: Event = {
	type: "on",
	event: "ready",
	script: async (client, commands, database, ..._args) => {
		if (!client.user) return;
		console.log(`${client.user.tag}: Bot is Online & Ready`);

		await Denblox.login(Deno.env.get("COOKIE")!).catch((err) => {
			console.log(err);
		});

		Unban(client, database);

		return commands.forEach(async ({ script, ...cmd }: Command) => {
			await client.interactions.commands.create(cmd, Deno.env.get("GUILD"));
			client.interactions.handle(cmd.name, async (interaction) => {
				try {
					await script(client, interaction, database);
				} catch (error) {
					console.error(error);
					const msg = "Something went wrong with this interaction!";

					return interaction.reply(msg, { ephemeral: true }).catch(() => {
						return interaction.editResponse({ content: msg, ephemeral: true }).catch(() => {});
					});
				}
			});
		});
	},
};

export default Event;

function Unban(client: Harmony.Client, mongo: MongoClient) {
	setInterval(async () => {
		const collection = mongo.database("Strombre").collection<UserSchema>("users");
		const users = await collection
			.find({ infractions: { $elemMatch: { type: "ban" } } })
			.toArray();

		for (const banned of users) {
			const warnings = banned.infractions!.filter((x) => x.type === "ban").at(-1);
			if (!warnings?.DateToUnban) continue;

			const banDate = warnings.date.getTime();
			const unbanDate = warnings.DateToUnban.getTime();
			if (banDate < unbanDate) continue;

			const guild = await client.guilds.fetch(Deno.env.get("GUILD")!).catch(() => {});
			if (!guild) throw "no guild";

			const ban = await guild.bans.get(banned.id).catch(() => {});
			if (!ban) continue;

			const success = await guild.bans.remove(ban.user).catch(() => {});
			if (!success) continue;

			collection
				.updateOne({ id: ban.user.id }, { $pull: { infractions: { id: warnings.id } } })
				.catch(() => {});

			continue;
		}
	}, 3.6e6);
}
