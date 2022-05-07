import { Messages } from "./helper/src.ts";
import { Command } from "../../config/events.d.ts";
import { Harmony } from "../../config/deps.ts";

const Command: Command = {
	name: "snipe",
	description: "Snipe a recent message that was deleted",
	script: (_client, slash) => {
		try {
			const message = [...Messages]?.[0]?.pop() as Harmony.Message | undefined;

			const msg =
				message?.author && message.content
					? `**${message.author.tag} said:** ${message.content}`
					: "There are no messages to snipe!";

			slash.reply(msg, { ephemeral: true });
		} catch (_) {
			console.error(_);
			slash.reply("Something went wrong with this interaction!").catch(() => {});
		}
	},
};
export default Command;
