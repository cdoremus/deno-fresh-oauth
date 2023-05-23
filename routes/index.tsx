import { Head } from "$fresh/runtime.ts";

export default function Home() {
  return (
    <>
      <Head>
        <title>Deno Fresh Auth</title>
      </Head>
      <div class="flex items-center bg-gray-200 p-5 mx-auto h-1/5">
        <div class="flex items-center flex-grow-1">
          <img
            src="/logo.svg"
            class="w-32 h-32 ml-10"
            alt="the fresh logo: a sliced lemon dripping with juice"
          />
          <span class="text-3xl font-bold">
            Welcome to Deno Fresh Auth
          </span>
        </div>
        <nav class="flex flex-grow-0">
          <a href="/login" class="ml-4">Login</a>
          <a href="#" class="ml-4">Link 2</a>
        </nav>
      </div>
      <div class="flex items-center w-100">
        <p>Content here</p>
      </div>
    </>
  );
}
