import { Command } from "../../config/events.d.ts";
import { Harmony } from "../../config/deps.ts";
import { ModerationEmbed } from "./helper/embed.ts";

const script: Command = {
	name: "send",
	description: "Send any message to a specific channel",
	options: [
		{
			name: "channel",
			type: "CHANNEL",
			required: true,
			description: "The channel to send the message to",
		},
		{
			name: "content",
			type: "STRING",
			required: true,
			description: "The content to send to the channel",
		},
		{
			name: "hex-code",
			description: "The color of the embed",
			type: "STRING",
		},
		{
			name: "title",
			type: "STRING",
			description: "The title of the message",
		},
	],

	script: async (_c, slash, _d) => {
		if (!slash.member) return;

		const channel = await (slash.option("channel") as Harmony.InteractionChannel)
			.resolve()
			.catch(() => {});
		const content = slash.option("content") as string;
		const HexCode = slash.option("hex-code") as string;
		const title = slash.option("title") as string;

		//prettier-ignore
		if(!channel || !channel.isGuildTextBased()) return await slash.reply("Please provide a valid channel", { ephemeral: true});
		//prettier-ignore
		if (!content || /^[\w\W]{1,10}$/g.test(content)) return await slash.reply("Please provide a valid description", { ephemeral: true });
		//prettier-ignore
		if(title && /^[\w\W]{1,4}$/g.test(title)) return await slash.reply("Please provide a longer title", { ephemeral: true });
		//prettier-ignore
		if (HexCode && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/gm.test(HexCode)) return await slash.reply("Please provide a valid hex code!", { ephemeral: true })

		const Embed = new Harmony.Embed({
			title,
			description: content,
			thumbnail: { url: _c.user?.avatarURL(), height: 200, width: 200 },
		});

		if (HexCode) Embed.setColor(HexCode);

		await channel.send({ embeds: [Embed] });

		//prettier-ignore
		const embed = ModerationEmbed(_c, "Send", `A moderator has recently used \`send\` by ${slash.member}`);
		embed.addFields(
			{ name: "__Information__", value: `Channel: ${channel}` },
			{
				name: "__Embed Information__",
				value: `${title ? `Title: \`${title}\`\n` : ""}${
					HexCode ? `Hex Code: \`${HexCode}\`\n` : ""
				} Content: \`${content}\``,
			},
		);

		const logs = await slash.guild?.channels.fetch(Deno.env.get("LOG"));
		if (logs?.isText()) logs.send({ embeds: [embed] }).catch(() => {});

		return await slash.reply("Successfully sent your message", { ephemeral: true });
	},
};

export default script;
