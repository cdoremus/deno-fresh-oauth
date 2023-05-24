// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import { redirect } from "@/utils/http.ts";
import {
  createUser,
  getUserById,
  setUserSession,
  type User,
} from "@/utils/db.ts";
import { State } from "./_middleware.ts";
import { getAccessToken, setCallbackHeaders } from "@/utils/deno_kv_oauth.ts";
import { oauth2Client } from "@/utils/oauth2_client.ts";

interface GitHubUser {
  id: number;
  name: string;
  login: string;
  avatar_url: string;
  email: string;
}

async function getUser(accessToken: string): Promise<GitHubUser> {
  const response = await fetch("https://api.github.com/user", {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error();
  }
  return await response.json() as GitHubUser;
}

// deno-lint-ignore no-explicit-any
export const handler: Handlers<any, State> = {
  async GET(req) {
    const accessToken = await getAccessToken(req, oauth2Client);
    const githubUser = await getUser(accessToken);
    const sessionId = crypto.randomUUID();

    const user = await getUserById(githubUser.id.toString());
    if (!user) {
      const userInit: User | null = {
        id: githubUser.id.toString(),
        name: githubUser.name,
        username: githubUser.login,
        avatarUrl: githubUser.avatar_url,
        sessionId,
      };
      await createUser(userInit);
    } else {
      await setUserSession(user, sessionId);
    }

    const response = redirect("/");
    setCallbackHeaders(response.headers, sessionId);
    return response;
  },
};
