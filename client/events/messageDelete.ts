import { Harmony } from "../config/deps.ts";
import { Event } from "../config/events.d.ts";
import { Messages } from "../commands/other/helper/src.ts";

const Event: Event = {
	type: "on",
	event: "messageDelete",
	script: (client, _, message: Harmony.Message) => {
		if (!client || !message || !message.author) return;

		Messages.set(message.content, message);
		setTimeout(() => {
			Messages.delete(message.content);
		}, 30000);

		const msg = `**Message sniped by: ${message.author}** - ${message.content}`;
		return message.channel.send(msg);
	},
};

export default Event;
