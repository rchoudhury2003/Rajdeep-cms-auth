export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/auth") {
      const redirectUri = `${url.origin}/callback`;
      const authUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo`;
      return Response.redirect(authUrl, 302);
    }

    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });
      const tokenData = await tokenRes.json();
      const token = tokenData.access_token;

      const html = `<!doctype html><html><body>
<script>
(function(){
  function send(msg){ window.opener.postMessage(msg, "*"); }
  send("authorizing:github");
  window.addEventListener("message", function(e){
    if (e.data === "authorizing:github") {
      send("authorization:github:success:" + JSON.stringify({ token: ${JSON.stringify(token)}, provider: "github" }));
      window.close();
    }
  }, false);
})();
</script>
Authorized — you can close this window.
</body></html>`;
      return new Response(html, { headers: { "Content-Type": "text/html" } });
    }

    return new Response("Not found", { status: 404 });
  },
};
