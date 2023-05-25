// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import {
  createUser,
  deleteUser,
  getUserById,
  getUserByLogin,
  getUserBySessionId,
  setUserSession,
  type User,
} from "./db.ts";
import { assertEquals } from "std/testing/asserts.ts";

Deno.test("[db] user", async () => {
  const initUser = {
    id: crypto.randomUUID(),
    name: "Foobar",
    email: "foo@bar.com",
    username: crypto.randomUUID(),
    avatarUrl: "https://example.com",
    sessionId: crypto.randomUUID(),
  };

  await createUser(initUser);
  let user = { ...initUser } as User;
  assertEquals(await getUserById(user.id), user);
  assertEquals(await getUserByLogin(user.username), user);
  assertEquals(await getUserBySessionId(user.sessionId), user);

  const sessionId = crypto.randomUUID();
  await setUserSession(user, sessionId);
  user = { ...user, sessionId };
  assertEquals(await getUserById(user.id), user);
  assertEquals(await getUserByLogin(user.username), user);
  assertEquals(await getUserBySessionId(user.sessionId), user);

  await deleteUser(user);
  assertEquals(await getUserById(user.id), null);
  assertEquals(await getUserByLogin(user.username), null);
  assertEquals(await getUserBySessionId(user.sessionId), null);
});
