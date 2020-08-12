const express = require('express');
const request = require('request');
const cors = require('cors');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const open = require('open');

const client_id = '';
const client_secret = '';
const redirect_uri = 'http://localhost:8888/callback';

function generateRandomString(length) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

function getHtml(access_token, refresh_token) {
  return `
<script>
function copyToClipboard(str) {
  navigator.clipboard.writeText(str).then(() => {
    alert('Copied to clipboard');
  });
}
</script>

<style>
  div {
    cursor: pointer;
  }
</style>

<div onclick="copyToClipboard('${access_token}')">access token (click to copy to clipboard): ${access_token}</div>
<br />
<div onclick="copyToClipboard('${refresh_token}')">refresh token (click to copy to clipboard): ${refresh_token}</div>
`;
}

const stateKey = 'spotify_auth_state';

const app = express();

app.use(cors())
  .use(cookieParser());

app.get('/login', (req, res) => {
  const state = generateRandomString(16);
  res.cookie(stateKey, state);

  const scope = 'user-read-private user-read-email user-follow-read user-follow-modify user-library-read playlist-modify-private';

  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.send('Error: state mismatch');
  } else {
    res.clearCookie(stateKey);

    const authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const {access_token, refresh_token} = body;
        const html = getHtml(access_token, refresh_token);

        res.send(html);
      } else {
        res.send('Error: invalid token');
      }
    });
  }
});

console.log('Listening on 8888');

app.listen(8888);

(async () => {
  await open('http://localhost:8888/login');
})();
