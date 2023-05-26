# NOTE: This document is a Work-in-Progress

# Using OAuth with a Fresh application

Authentication and authorization is an important application service that
assures that your app is secure and that anonymous users only have access to the
public parts of your site.

Using a well-known [OAuth 2](https://oauth.net/2/) provider such as Github,
Google or Twitter is a simple way to provide authentication and authorization.
It also is convenient for your users since they don't have to remember another
username and password when your app uses OAuth.

Authorization with OAuth involves a multi-step process:

1. Logging into an OAuth provider's auth server, getting back an auth code from
   the server.
2. Using the auth code to obtain a auth token
3. Using the token to access protected resources, usually just a user identifier
   like a name or login username.

The OAuth (OAuth2) standard strictly only concerns the authorization process,
but authentication is covered by an OAuth provider since they require that a
user be logged in to authorize an OAuth application.

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
component to add content to the `<head>` element. The repo holding the code can
be found at https://github.com/cdoremus/deno-fresh-oauth.

## Using OAuth to secure app routes

**Register your application**

In order to work with an OAuth provider, you need to register your app with the
provider. To
[register a new GitHub OAuth application](https://github.com/settings/applications/new)
you need to provide the following values:

- `Application name` = a name of your own choosing
- `Homepage URL` = `http://localhost:8000`
- `Authorization callback URL` = `http://localhost:8000/callback`

After clicking the 'Register Application' button the resulting page shows a
Client ID property. Clicking 'Generate new client secret' creates a Client
Secret. Copy the Client ID and Client Secret into a`.env` file containing
GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET variables.

Add the following import to `dev.ts` to allow the client id and client secret to
be available to the application using the `Deno.env.get` call:

```ts
import "std/dotenv/load.ts";
```

Most production server environments have alternate ways to expose environmental
variables to the deployed application. In Deno Deploy, there is an Environmental
Variables section under the Settings tab.

**Securing a route**

We are using OAuth to secure the `/secured` route that holds private
information. You'll noticed that if you aren't logged in and try to browse to
the `/secured` route you will be redirected back to the home page ('/`).

Fresh middleware is used to guard our secured area. The middleware checks that a
`sessionId` has been set on the Fresh Context state field. That field is set
once authentication occurs. In Fresh, a `_middleware.ts` file is used to define
middleware (see the
[Route MIddleware docs](https://fresh.deno.dev/docs/concepts/middleware)).

The OAuth flow in the demo app begins with the `login.ts` route which checks to
see if the `sessionId` variable has been set. If not, the user is redirected to
the Github OAuth flow via the `redirectToOAuthLogin()` function.

```ts
export const handler: Handlers<any, State> = {
  async GET(_req, ctx) {
    return ctx.state.sessionId
      ? redirect("/secured")
      : await redirectToOAuthLogin(oauth2Client);
  },
};
```

The Github OAuth flow uses the provider's API to interact with the application.
The Deno-native library
[`deno-oauth2-client`](https://github.com/cmd-johnson/deno-oauth2-client) wraps
the generic OAuth flow including Github's implementation and we are using that
in our demo app.

**Calling the OAuth API**

The `deno-oauth2-client` lib uses a `OAuth2Client` class to encapsulate the
OAuth flow. It is instantiated in the `utils/oauth2_client.ts` file:

```ts
export const oauth2Client = new OAuth2Client({
  clientId: Deno.env.get("GITHUB_CLIENT_ID")!,
  clientSecret: Deno.env.get("GITHUB_CLIENT_SECRET")!,
  authorizationEndpointUri: "https://github.com/login/oauth/authorize",
  tokenUri: "https://github.com/login/oauth/access_token",
  defaults: {
    scope: "read:user",
  },
});
```

The `authorizationEndpointUri` and `tokenUri` is used to access the OAuth
provider's authorization process. We covered getting the `clientId` and
`clientSecret` above. Make sure they are in a private place and not pushed to
your Github repo.

The `scope` determines what private information the user authorizes access to.
Scopes can be different for each OAuth provider, but they define a subset of the
users data that will be available to the client application. For Github, the
`read:user` scope gives read-only access to basic user information including
name, login username and avatar URL.

The two main functions on the `OAuth2Client` class `code` field covers the
authorization endpoint (`getAuthorizationUri()`) and access token (`getToken()`)
calls to the OAuth provider.

Once a user has been authenticated, the session id is stored in a browser cookie
called 'session' that is 36 characters long. The `setSessionCookie`,
`getSessionCookie` and `delete sessionCookie` functions in
`utils/deno_kv_oauth.ts` is used for cookie manipulation. The browser cookie is
also used to look up a user and get his/her data returned from Github to be
displayed on the `/secured` page.

The Logout link is shown after a user logs in. Clicking on it deletes the
'session' browser cookie.

TODO: MORE STUFF XXXXXXXXXXXXXXXXXXXX

.....................................

- **TODO:** Refresh token
  - `RefreshTokenGrant.refresh` called
  - Difficult to test in Github because tokens don't expire until 1 year

............ NOTES .................

- create code to interact with the OAuth provider to lead the user through the
  OAuth flow. The flow....
  - using the `deno-oauth2-client` library.
    - Add to import map
- `login.ts` and `logout.ts` routes are used to interact with the OAuth
  providers API via the `deno-oauth2-client` library.
- `utils/deno_kv_oauth.ts` wraps `deno-oauth2-client` calls inside convenience
  methods.

  .....................................

## Using Deno KV to store session and user data

Deno KV is a simple key-value store recently added to the Deno runtime and soon
coming to Deno Deploy. Currently, the API has been marked _unstable_ so be aware
that some of the code in this article and in the associated demo app may change
in the future.

- KV is used here to temporarily store session data during the
  authentication/authorization process as described in the previous section.

- KV is also used here to store user information obtained from github in various
  ways for easy access in a variety of ways.

- There is a `oauth-session` store used to persist ................

- When a user logs out and logs in again a new record is added to the the
  `users-by-session` KV store.

## Conclusion

This article demonstrated how to use an OAuth provider to easily add add
authentication and authorization to your Fresh application using a secure,
battle-tested protocol. While we provide an example with Fresh here, there is no
reason why you could not use OAuth to secure application build with Oak, Aleph,
Ultra or any other Deno web framework.

Similarly, another OAuth provider can be used instead of Github or you can allow
the user to select from a number of different providers. In that case, there is
a different mechanism to register your application with a provider and different
argument values used to call `OAuth2Client` including different values of the
default `scope`.

TODO: XXXXXXXXXXXXXXXXXXXXXXXXXXX

---

**Appendix: Development and Troubleshooting Tips**

- To debug the demo application in Chrome, run the `debug` task, browse to
  `chrome://inspect` and click on the `inspect` link. The Dev Tools `sources`
  tab will come up where you can set breakpoints, step through the application
  code and view object values. If no source comes up in the tree view, you may
  need to click on 'add folder to workspace' and manually add your workspace
  folder.
- To retest OAuth flow, revoke app access by going to Settings -> Applications
  -> Authorized OAuth Apps. Find the app on the list and select Revoke from the
  menu. You also need to delete the 'session' cookie in the browser Dev Tool's
  Applications tab. When you access the app again, you will be forced into the
  Github OAuth flow again.
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
