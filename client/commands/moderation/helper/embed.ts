import { Harmony } from "../../../config/deps.ts";

export const ModerationEmbed = (client: Harmony.Client, type: string, msg: string) => {
	return new Harmony.Embed({
		author: { name: "Strombré Moderation", url: client.user?.avatarURL() },
		title: type,
		description: `This Embed provides information about a recent moderator command used.\n\n***${msg}***`,
		footer: { text: new Date().toLocaleString("en-US") },
	});
};
