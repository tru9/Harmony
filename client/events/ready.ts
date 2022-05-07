import { Event, Command } from "../config/events.d.ts";

const Event: Event = {
	type: "on",
	event: "ready",
	script: (client, commands, ..._args) => {
		if (!client.user) return;
		console.log(`${client.user.tag}: Bot is Online & Ready`);

		return commands.forEach(async (cmd: Command) => {
			await client.interactions.commands.create(cmd, "837525370508279828");
			client.interactions.handle(cmd.name, (interaction) => cmd.script(client, interaction));
		});
	},
};

export default Event;
