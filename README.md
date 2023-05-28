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
be found at https://github.com/cdoremus/deno-fresh-oauth. The deployed app can
be views at https://fresh-oauth.deno.dev.

## Using OAuth to secure app routes

**Register your application**

In order to work with an OAuth provider, you need to register your app with the
provider. To
[register a new GitHub OAuth application](https://github.com/settings/applications/new)
you need to provide the following values:

- `Application name` = a name of your own choice
- `Homepage URL` = `http://localhost:8000`
- `Authorization callback URL` = `http://localhost:8000/callback`

After clicking the 'Register Application' button the resulting page shows a
Client ID property. Clicking 'Generate new client secret' creates a Client
Secret. Copy the Client ID and Client Secret into a`.env` file containing
GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET variables.

Add the following import to `dev.ts` to allow the client id and client secret to
be available to the application using `Deno.env.get`:

```ts
import "std/dotenv/load.ts";
```

Most production server environments have alternate ways to expose environmental
variables to the deployed application. In Deno Deploy, there is an Environmental
Variables section under the Settings tab.

**Securing a route**

We are using OAuth to help secure the `/secured` route that holds private
information. You'll noticed that if you aren't logged in and try to browse to
`/secured` you will be redirected back to the home page (`/`).

[Fresh middleware](https://fresh.deno.dev/docs/concepts/middleware) is used to
guard our secured area. The middleware checks that a `sessionId` has been set on
the Fresh Context state field. That field is set once authentication occurs. In
Fresh, a `_middleware.ts` file is used to define middleware on a route.

The OAuth flow in the demo app begins when the user clicks on the `Login` link
invoking the `/login` route (`login.ts`) The route's handler function checks to
see if a `sessionId`variable has been set. If not, the user is redirected to the
Github OAuth flow via the`redirectToOAuthLogin()` function.

```ts
// routes/login.ts
export const handler: Handlers<any, State> = {
  async GET(_req, ctx) {
    return ctx.state.sessionId
      ? redirect("/secured")
      : await redirectToOAuthLogin(oauth2Client);
  },
};
```

The `redirectToOAuthLogin()` function is our gateway into the OAuth flow. We are
using the Deno-native library
[`deno-oauth2-client`](https://github.com/cmd-johnson/deno-oauth2-client) that
abstracts the generic OAuth process. This lib uses a `OAuth2Client` class as a
starting point. It is instantiated in the `utils/oauth2_client.ts` file:

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

The `authorizationEndpointUri` and `tokenUri` arguments are used to during the
OAuth flow. The `clientId` and `clientSecret` values come from environmental
variables the we previously set. Make sure they are in a private place and not
pushed to your Github repo by adding `.env` to `.gitignore`.

The default `scope` argument determines what private user information our
application has access to. Scopes can be different for each OAuth provider. For
Github, the `read:user` scope gives read-only access to basic user information
including name, login username and avatar URL.

The `OAuth2Client` class's `code` field (an `AuthorizationCodeGrant` class
instance) is used for authorization endpoint (`getAuthorizationUri()`) and
access token (`getToken()`) calls to the OAuth provider.

As noted above, clicking the `Login` (`/login`) link leads us back to the
`redirectToOAuthLogin()` function in `utils/deno_kv_oauth.ts` called by the
`login.ts` handler function.

```ts
export async function redirectToOAuthLogin(oauth2Client: OAuth2Client) {
  const state = crypto.randomUUID(); // random state
  const { uri, codeVerifier } = await oauth2Client.code.getAuthorizationUri({
    state,
  });
  // Store the state and code verifier server-side in Deno KV
  const oauthSessionId = crypto.randomUUID();
  await setOAuthSession(oauthSessionId, {
    state,
    codeVerifier,
  });
  // Store the state and code verifier client-side in a session cookie
  const headers = new Headers({ location: uri.toString() });
  setOAuthSessionCookie(headers, oauthSessionId);
  // Redirect to the authorization endpoint
  return new Response(null, { status: 302, headers });
}
```

The `getAuthorizationUri()` call requests the authorization URL and code
verifier from Github. A randomly generated state token and the code verifier is
stored temporarily in Deno KV. In addition, a session id is randomly generated
and stored in a browser cookie called `session`. Finally, the response is
redirected back to the authorization endpoint.

The next step is to obtain the access token using the `getAccessToken()` called
in the `/callback` route's handler function. Recall that we configured our
Github OAuth callback URL to be that route. Here is an annotated look at what
goes on inside of `getAccessToken()`:

```ts
export async function getAccessToken(
  request: Request,
  oauth2Client: OAuth2Client,
) {
  // get session cookie holding session id
  const oauthSessionId = getOAuthSessionCookie(request.headers);
  // get session from Deno KV store
  const oauthSession = await getOAuthSession(oauthSessionId);
  // delete session from Deno KV
  await deleteOAuthSession(oauthSessionId);
  // get the token from the access token endpoint
  const tokens = await oauth2Client.code.getToken(request.url, oauthSession);

  return tokens.accessToken;
}
```

Finally, the access token is used to get user information from Github in the
`callback.ts` route's handler function. Here's what happens there:

```ts
// routes/callback.ts
export const handler: Handlers<any, State> = {
  async GET(req) {
    // get the OAuth access token
    const accessToken = await getAccessToken(req, oauth2Client);
    // call GH user API using the access token
    const githubUser = await getUser(accessToken); // local function
    const sessionId = crypto.randomUUID();
    // find user in the Deno KV store
    const user = await getUserById(githubUser.id.toString());
    if (!user) {
      const userInit: User | null = {
        id: githubUser.id.toString(),
        name: githubUser.name,
        email: githubUser.email,
        username: githubUser.login,
        avatarUrl: githubUser.avatar_url,
        sessionId,
      };
      // Insert user in the the KV store
      await createUser(userInit);
    } else {
      // Update users session in KV
      await setUserSession(user, sessionId);
    }
    // return to the home page
    const response = redirect("/");
    setCallbackHeaders(response.headers, sessionId);
    return response;
  },
};
```

Once the `callback.ts` handler function completes, the app user has been
authenticated and the application has all the user information it needed from
Github and what it needs to secure the `/secured` route.

**The refresh token**

Another concept in the OAuth flow is the refresh token. This token is sent back
with the access token and used when the access token expires to get a new access
token.

In the case of Github, the access token expires after one year, so the refresh
scenario would be very difficult to test. You would probably want your user to
go through the OAuth flow again at that point too. In the `deno-oauth2-client`
lib the `RefreshTokenGrant.refresh()` method is used for token refresh.

## Using Deno KV to store session and user data

Deno KV is a simple key-value store recently added to the Deno runtime and
coming soon to Deno Deploy. Currently, the API has been marked _unstable_, so be
aware that some of the code in this article and in the associated demo app may
change in the future.

The basic KV CRUD operations utilize the `set()` (create and update), `get()`
(read) and `delete` (delete) functions on the `Deno.Kv` class (see the
[Deno.KV API docs](https://deno.land/api@v1.34.0?unstable=&s=Deno.Kv) and the
[KV section in the Deno Manual](https://deno.com/manual@v1.34.0/runtime/kv)).

KV is used here to temporarily store session data during the OAuth flow between
the call to the authorization URL and the call to get the access token.

KV is also used here to store user information obtained from Github in various
ways to facilitate performant queries. They include:

- `users` - store users by a user id
- `users_by_login` - store users by the Github username
- `users_by_session` - store users by the session id

A KV [Key](https://deno.com/manual@v1.34.0/runtime/kv/key_space#keys) is an
array sequence with members called parts. In our case, we have a name part and
an id part so that in the key `["users", "1 ]`, "users" would be the name and
"1" would be the id. Retrieving a user from KV would involved using that key as
the `get()` call argument.

In each case, the KV value is a `User` object defined by this interface:

```ts
export interface User {
  id: string;
  name: string;
  email?: string;
  username: string; // called 'login' in GH API
  avatarUrl: string;
  sessionId: string;
}
```

The email value may be null since the Github allows users to set their email
address as private.

We should note here that we do not use the `users` KV store. If you were to add
an admin interface to the app you would probably display a list of users. In
that case you'd add a `role` field to the `User` object to make sure that
ordinary users (`role: user`) could not become an admin (`role: admin`).
Following the lead of many tutorials, we'll leave this as an exercise for our
readers.

**Storing the session in a cookie**

Once a user has been authenticated, the session id is stored in a browser cookie
called 'session'. The `setSessionCookie`, `getSessionCookie` and
`deleteSessionCookie` functions in `utils/deno_kv_oauth.ts` is used for cookie
manipulation. The browser cookie is also used to look up a user and get the user
data returned from Github to be displayed on the `/secured` page.

The `Logout` link is shown in the page header after a user logs in. Clicking on
it deletes the 'session' browser cookie via the `routes/logout.ts` handler
function. The record in the `users_by_session` KV store associated with the
deleted cookie's session id is also deleted. Both of these actions stops the
user from accessing to the secured route.

## Conclusion

This article demonstrated how to use an OAuth provider to easily add add
authentication and authorization to your Fresh application using a secure,
battle-tested protocol. While we provide an example with Fresh here, there is no
reason why you could not use OAuth to secure application build with Oak, Aleph,
Ultra or any other Deno web framework.

Similarly, another OAuth provider can be used instead of Github or you can allow
the user to select from a number of different providers. If the user decides to
use a non-Github provider, the application needs to be registered with the
provider by a different mechanism and different argument values will be used to
call `OAuth2Client` including different values for the default `scope`.

While Deno KV is supported in Deno Deploy, it is only available by invitation,
but you can [request access](https://dash.deno.com/kv). You can also deploy a KV
app using Docker. See the
[README.md in the SaaSKit Github repository](https://github.com/denoland/saaskit#using-docker-to-deploy-to-any-vps)
for directions on how to do that.

---

_The author would like to thank Asher Gomez of the Deno team for his help
understanding OAuth and KV. You'll notice that much of the code in the demo app
is adapted from the SaaSKit repository where Asher leads its development._

---

**Appendix: Development and Troubleshooting Tips**

- A debugger can be your friend here because there's a lot going on during the
  OAuth flow. To debug the demo application in Chrome, run the `debug` task,
  browse to `chrome://inspect` and click on the `inspect` link. The Dev Tools
  `sources` tab will come up where you can set breakpoints, step through the
  application code and view object values. If no source comes up in the tree
  view, you may need to click on 'add folder to workspace' and manually add your
  workspace folder.
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
