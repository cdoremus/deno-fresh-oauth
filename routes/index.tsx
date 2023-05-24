import Layout from "../components/Layout.tsx";
import type { Handlers, PageProps } from "$fresh/server.ts";
// import { SITE_WIDTH_STYLES } from "@/utils/constants.ts";
// import Head from "@/components/Head.tsx";
import type { State } from "./_middleware.ts";
// import ItemSummary from "@/components/ItemSummary.tsx";
import {
  // getAllItems,
  getUserBySessionId,
  // getUsersByIds,
  // getVotedItemIdsByUser,
  // type Item,
  type User,
} from "@/utils/db.ts";

interface HomePageData extends State {
  user: User;
}

export const handler: Handlers<HomePageData, State> = {
  async GET(_req, ctx) {
    let user;
    if (ctx.state.sessionId) {
      user = await getUserBySessionId(ctx.state.sessionId!);
    }

    return ctx.render({ ...ctx.state, user });
  },
};

export default function Home(props: PageProps<HomePageData>) {
  // console.log("Context data for home page: ", JSON.stringify(props));
  const sessionId = props.data.sessionId;
  return (
    <Layout session={sessionId}>
      <div class="flex items-center w-100">
        <a href="/secured" class="font-bold text-lg bg-blue">
          View Secured Content
        </a>
      </div>
    </Layout>
  );
}
