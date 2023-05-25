import Layout from "../components/Layout.tsx";
import type { Handlers, PageProps } from "$fresh/server.ts";
import type { State } from "./_middleware.ts";
import { getUserBySessionId, type User } from "@/utils/db.ts";

interface HomePageData extends State {
  user: User;
}

export const handler: Handlers<HomePageData, State> = {
  async GET(_req, ctx) {
    // console.log("CONTEXT: \n", JSON.stringify(ctx));
    let user;
    if (ctx.state.sessionId) {
      user = await getUserBySessionId(ctx.state.sessionId!);
    }

    return ctx.render({ ...ctx.state, user });
  },
};

export default function Home(props: PageProps<HomePageData>) {
  // console.log("Context data for home page: ", JSON.stringify(props));
  const { sessionId } = props.data;
  return (
    <Layout session={sessionId}>
      <div class="flex justify-center p-8">
        <div class="font-bold text-2xl text-center">
          {sessionId
            ? (
              <a
                href={`/secured`}
                class="underline decoration-teal-300"
              >
                View Secured Content
              </a>
            )
            : <div>Login to view your private information</div>}
        </div>
      </div>
    </Layout>
  );
}
