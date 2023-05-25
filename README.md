# NOTE: This document is a Work-in-Progress

# Using OAuth with a Fresh app

Using a well-known OAuth provider such as Github, Google or Twitter is a simple
way to provide authentication and authorization in a Deno Fresh app. It also
helps the user by not having to remember another username and password.

The OAuth provider will do the authentication and authorize access to a subset
of the user's private data. Most of the time an app will only need the user's
name and email address.

Authorization with OAuth involves a multi-step process:

1. Logging into an OAuth provider's auth server, getting back an auth code from
   the server.
2. Using the auth code to obtain a auth token
3. Using the token to access protected resources

The OAuth (OAuth2) standard strictly only covers the authorization process, but
OAuth providers require that a user be logged in to authorize an OAuth
application.

## Getting started

We will be creating an app to demonstrate OAuth using Github as an OAuth
provider in a Fresh app. To get started, lets scaffold out the app using the
Fresh initialization script.

```ts
$ deno run -A -r https://fresh.deno.dev my-oauth-app
```

After the app is created, delete the following unneeded code:
`islands/Counter.tsx`, `routes/api/jokes.ts` and `routes/[name].tsx` You'll next
need to clean up the `routes/index.tsx` by removing any reference to the
`Counter` component.

Then you can start the app using `deno task start` from the command line. Go to
https://localhost:8000 and make sure the app properly renders the home page.

Stop the server and clean out the content from `routes/index.tsx` so it can be
replaced by your app's home page content. We created a `Layout` component to
wrap each page's content in a header and footer and used Fresh's built-in `Head`
component to add content to the `<head>` element. The repo holding the code

## Interacting with the OAuth provider using an API

- Register the app on Github as an OAuth App

- create code to interact with the OAuth provider to lead the user through the
  OAuth flow. The flow....
  - using the `deno-oauth2-client` library.
    - Add to import map
- `login.ts` and `logout.ts` routes are used to interact with the OAuth
  providers API via the `deno-oauth2-client` library.
- `utils/deno_kv_oauth.ts` wraps `deno-oauth2-client` calls inside convenience
  methods.

- **TODO:** Refresh token

### Demonstrates a user's interaction with the Github OAuth flow:

1. Click on the app's `login` link
2. Redirected to Github where you may need to login
3. Moved to the GH Authorize screen where you will be asked to authorize the
   previously registered app to gain access to some of your basic user
   information.
   - ??Graphic here??
   - Provide a link to the Github basic:user scope page listing the available
     user properties.

## Using Deno KV to store session and user data

Deno KV is a simple key-value store recently added to the Deno runtime and soon
coming to Deno Deploy. Currently, the API has been marked _unstable_ so be aware
that some of the code in this article and in the associated demo app may change
in the future.

- KV is used here to temporarily store session data during the
  authentication/authorization process as described in the previous section.

- KV is also used here to store user information obtained from github in various
  ways for easy access in a variety of ways.

## Securing routes

## Conclusion

## Appendix: Development and Troubleshooting Tips

- To retest OAuth flow, revoke app access by going to Settings -> Applications
  -> Authorized OAuth Apps. Find the app on the list and select Revoke from the
  menu. When you access the app again, you will be forced into the Github OAuth
  flow. You should also delete the 'session' cookie in the browser Dev Tool's
  Applications tab.
- To clear your KV database, run the following snippet in the Deno repl using
  the `--unstable` flag:

```ts
const kv = await Deno.openKv();
const rows = kv.list({ prefix: [] });
for await (const row of rows) {
  kv.delete(row.key);
}
```

If you are curious about what data is in the database, just substitute
`console.log(JSON.stringify(row))` for the `kv.delete` call.
