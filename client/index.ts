import { Harmony } from "./config/deps.ts";
import { Command } from "./config/events.d.ts";
import "https://deno.land/x/dotenv@v3.2.0/load.ts";
import { ExecuteEvents, Commands } from "./events/src.ts";

const Client = new Harmony.Client();
Client.connect(Deno.env.get("APP"), [
	Harmony.GatewayIntents.GUILDS,
	Harmony.GatewayIntents.GUILD_MESSAGES,
	Harmony.GatewayIntents.DIRECT_MESSAGES,
	Harmony.GatewayIntents.GUILD_MEMBERS,
]);

const cmds: Map<string, Command> = new Map();

Commands(cmds);
ExecuteEvents(Client, cmds);
