import { Head } from "$fresh/runtime.ts";
import type { ComponentChildren } from "preact";

type LayoutProps = {
  children: ComponentChildren;
  title?: string;
  session?: string;
};

export default function Layout(props: LayoutProps) {
  const loginLink = props.session
    ? { href: "/logout", name: "Logout" }
    : { href: "/login", name: "Login" };
  return (
    <>
      <Head>
        <title>{props.title ? props.title : "Deno Fresh Auth"}</title>
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
          <a href={loginLink.href} class="ml-4">{loginLink.name}</a>
          <a href="/" class="ml-4">Home</a>
        </nav>
      </div>
      {props.children}
      <footer class="flex justify-center bg-gray-200 p-5">
        <a href="https://fresh.deno.dev">
          <img
            width="197"
            height="37"
            src="https://fresh.deno.dev/fresh-badge-dark.svg"
            alt="Made with Fresh"
          />
        </a>
      </footer>
    </>
  );
}
