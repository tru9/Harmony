import { Harmony } from "../../../config/deps.ts";

export async function UpdateUser(
	slash: Harmony.SlashCommandInteraction,
	member: Harmony.Member,
	roles: { old: string; new: string },
): Promise<boolean | undefined> {
	const GuildRoles = await slash.guild!.roles.collection();
	const oldRole = GuildRoles.find((role) =>
		role.name.toLowerCase().includes(roles.old.toLowerCase()),
	);

	const newRole = GuildRoles.find((role) =>
		role.name.toLowerCase().includes(roles.new.toLowerCase()),
	);

	if (!newRole?.name) return false;

	await member.roles.remove(oldRole!).catch(() => false);
	await member.roles.add(newRole!).catch(() => false);

	return;
}

export async function AddRoles(
	slash: Harmony.SlashCommandInteraction,
	member: Harmony.Member,
	roles: { old: string; new: string },
) {
	const ServerRoles = await slash.guild!.roles.collection();
	//prettier-ignore
	const old_role = ServerRoles.find((role) =>	new RegExp(`(${role.name})`, "gi").test(roles.old));
	//prettier-ignore
	const new_role = ServerRoles.find((role) =>	new RegExp(`(${role.name})`, "gi").test(roles.new));

	if (!new_role || !old_role) throw "";

	try {
		await member.roles.remove(old_role);
		await member.roles.add(new_role);
	} catch (error) {
		throw error;
	}
}
