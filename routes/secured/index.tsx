// import { Handlers } from "$fresh/server.ts";
// import { PageProps } from "$fresh/server.ts";
// import type { State } from "@/routes/_middleware.ts";
import Layout from "../../components/Layout.tsx";

// type PageData = {};

// export const handler: Handlers<PageData, State> = {
//   async GET(_req, ctx) {
//     // const posts = await getPosts();
//     // return ctx.render({ ...ctx.state, posts });
//   },
// };

export default function SecretPage() {
  return (
    <Layout>
      <div>
        <h1 class="font-400">
          This page is a secret for authorized users only!
        </h1>
      </div>
    </Layout>
  );
}
