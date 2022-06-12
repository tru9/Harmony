import { Harmony, MongoClient } from "../config/deps.ts";
import { Command, Event } from "../config/events.d.ts";

export async function ExecuteEvents(
	client: Harmony.Client,
	database: MongoClient,
	commands: Map<string, Command>,
) {
	for (const FileEvent of Deno.readDirSync("./client/events")) {
		if (FileEvent.name === "src.ts" || FileEvent.isDirectory) continue;

		const File = (await import(`./${FileEvent.name}`)).default as Event;
		if (!File) continue;

		client[File.type](File.event, (...args) =>
			File.script(client, commands, database, ...args),
		);
	}

	return;
}

export async function Commands(cmds: Map<string, Command>) {
	for (const FolderDir of Deno.readDirSync("./client/commands")) {
		if (!FolderDir || !FolderDir.isDirectory) continue;
		for (const cmd of Deno.readDirSync(`./client/commands/${FolderDir.name}`)) {
			if (!cmd.isFile) continue;
			const URL = `../commands/${FolderDir.name}/${cmd.name}`;

			try {
				const File = (await import(URL)).default as Command;
				cmds.set(cmd.name.split(".ts")[0], File);
				continue;
			} catch (_) {
				console.log(`${FolderDir.name} - Failed to load ${cmd.name.split(".ts")[0]}`);
			}
		}
	}
}
