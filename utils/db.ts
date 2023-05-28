// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { AssertionError } from "https://deno.land/std@0.186.0/testing/asserts.ts";

export const kv = await Deno.openKv();

export interface User {
  id: string;
  name: string;
  email?: string; // may be private
  username: string; // called 'login' in API
  avatarUrl: string;
  sessionId: string;
}

export async function createUser(user: User) {
  const usersKey = ["users", user.id];
  const usersByLoginKey = ["users_by_login", user.username];
  const usersBySessionKey = ["users_by_session", user.sessionId];
  const res = await kv.atomic()
    .check({ key: usersKey, versionstamp: null })
    .check({ key: usersByLoginKey, versionstamp: null })
    .check({ key: usersBySessionKey, versionstamp: null })
    .set(usersKey, user)
    .set(usersByLoginKey, user)
    .set(usersBySessionKey, user)
    .commit();

  if (!res.ok) {
    throw res;
  }

  return user;
}

export async function getUserById(id: string) {
  const res = await kv.get<User>(["users", id]);
  return res.value;
}

export async function getUserByLogin(login: string) {
  const res = await kv.get<User>(["users_by_login", login]);
  return res.value;
}

export async function getUserBySessionId(sessionId: string) {
  let res = await kv.get<User>(["users_by_session", sessionId], {
    consistency: "eventual",
  });
  if (!res.value) {
    res = await kv.get<User>(["users_by_session", sessionId]);
  }
  return res.value;
}

function isEntry<T>(entry: Deno.KvEntryMaybe<T>) {
  return entry.versionstamp !== null;
}

function assertIsEntry<T>(
  entry: Deno.KvEntryMaybe<T>,
): asserts entry is Deno.KvEntry<T> {
  if (!isEntry(entry)) {
    throw new AssertionError(`${entry.key} does not exist`);
  }
}

/** This assumes that the previous session has been cleared */
export async function setUserSession(
  user: User,
  sessionId: string,
) {
  const usersKey = ["users", user.id];
  const usersByLoginKey = ["users_by_login", user.username];
  const usersBySessionKey = ["users_by_session", sessionId];

  const [
    userRes,
    userByLoginRes,
  ] = await kv.getMany<User[]>([
    usersKey,
    usersByLoginKey,
  ]);

  [
    userRes,
    userByLoginRes,
  ].forEach((res) => assertIsEntry<User>(res));

  user = { ...user, sessionId } as User;

  const res = await kv.atomic()
    .check(userRes)
    .check(userByLoginRes)
    .check({ key: usersBySessionKey, versionstamp: null })
    .set(usersKey, user)
    .set(usersByLoginKey, user)
    .set(usersBySessionKey, user)
    .commit();

  if (!res.ok) {
    throw res;
  }
}

export async function deleteUser(user: User) {
  const usersKey = ["users", user.id];
  const usersByLoginKey = ["users_by_login", user.username];
  const usersBySessionKey = ["users_by_session", user.sessionId];

  const [
    userRes,
    userByLoginRes,
    userBySessionRes,
  ] = await kv.getMany<User[]>([
    usersKey,
    usersByLoginKey,
    usersBySessionKey,
  ]);

  const res = await kv.atomic()
    .check(userRes)
    .check(userByLoginRes)
    .check(userBySessionRes)
    .delete(usersKey)
    .delete(usersByLoginKey)
    .delete(usersBySessionKey)
    .commit();

  if (!res.ok) {
    throw res;
  }
}

export async function deleteUserBySession(sessionId: string) {
  await kv.delete(["users_by_session", sessionId]);
}

export async function getUsersByIds(ids: string[]) {
  const keys = ids.map((id) => ["users", id]);
  const res = await kv.getMany<User[]>(keys);
  // deno-lint-ignore no-explicit-any
  return res.map((entry: { value: any }) => entry.value!);
}
