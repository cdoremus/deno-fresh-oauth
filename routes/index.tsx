import { Head } from "$fresh/runtime.ts";

export default function Home() {
  return (
    <>
      <Head>
        <title>Fresh App</title>
      </Head>
      <div class="p-4 mx-auto max-w-screen-md">
        <img
          src="/logo.svg"
          class="w-32 h-32"
          alt="the fresh logo: a sliced lemon dripping with juice"
        />
        <span>
          Welcome to <span class="font-bold">Fresh</span>!!
        </span>
      </div>
      <div class="w-100">
        <a href="/login" class="w-auto rounded-md bg-green-400 p-2">
          Please login
        </a>
      </div>
    </>
  );
}
