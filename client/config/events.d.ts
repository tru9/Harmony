import { Harmony, MongoClient } from "./deps.ts";

export interface Event {
	type: "on" | "once";
	event: keyof Harmony.ClientEvents;
	// deno-lint-ignore no-explicit-any
	script: (
		client: Harmony.Client,
		commands: Map<string, Command>,
		database: MongoClient,
		...args: any[]
	) => void;
}

export interface Command extends Harmony.SlashCommandPartial {
	script: (
		client: Harmony.Client,
		slash: Harmony.ApplicationCommandInteraction,
		database: MongoClient,
	) => void;
}
