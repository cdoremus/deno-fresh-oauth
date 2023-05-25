import { Handlers } from "$fresh/server.ts";
import { PageProps } from "$fresh/server.ts";
import type { State } from "@/routes/_middleware.ts";
import Layout from "../../components/Layout.tsx";
import { getUserBySessionId, User } from "../../utils/db.ts";

interface SecuredPageData extends State {
  user: User;
}

export const handler: Handlers<SecuredPageData, State> = {
  async GET(_req, ctx) {
    let user;
    if (ctx.state.sessionId) {
      user = await getUserBySessionId(ctx.state.sessionId!);
    }

    return ctx.render({ ...ctx.state, user });
  },
};

export default function SecuredPage(props: PageProps<SecuredPageData>) {
  const sessionId = props.data.sessionId;
  const { name, email, username, avatarUrl } = props.data.user;
  return (
    <Layout session={sessionId}>
      <div class="flex flex-col items-center pl-20">
        <div class="flex font-bold text-red font-400 pb-10">
          This page is a secret for authorized users like you!
        </div>

        <div class="flex flex-col">
          <h2 class="font-bold text-3xl">Here's some of your secret stuff</h2>
          <div>
            <span class="font-bold text-2xl">Name:</span> {name}
          </div>
          {/* User may not have authorized email access */}
          {email
            ? (
              <div>
                <span class="font-bold text-2xl">Email:</span> {email}
              </div>
            )
            : ""}
          <div>
            <span class="font-bold text-2xl">Github Username:</span> {username}
          </div>
          <div>
            <span class="font-bold text-2xl">Github Avatar:</span>{" "}
            <img src={avatarUrl} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
