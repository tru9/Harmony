import { Harmony, Mongo, MongoClient } from "../config/deps.ts";

export interface Infraction {
	id: string;
	date: Date;
	type: string;
	reason: string;
	moderator: string;
	DateToUnban?: Date;
}

export interface UserSchema {
	_id: Mongo.ObjectId;
	id: string;
	rid: number;
	username: string;
	role: string;
	infractions?: Infraction[];
}

interface Roblox {
	username: string;
	rid: number;
	role: string;
}

export async function CreateUser(
	{ user }: Harmony.Member,
	data: Roblox,
	mongo: MongoClient,
) {
	const database = mongo.database("").collection<UserSchema>("users");

	if (await database.findOne({ id: user.id })) {
		return await database.findAndModify(
			{ id: user.id },
			{ update: { id: user.id, username: data.username, role: data.role, rid: data.rid } },
		);
	}

	return await database.insertOne({
		id: user.id,
		username: data.username,
		rid: data.rid,
		role: data.role,
	});
}
