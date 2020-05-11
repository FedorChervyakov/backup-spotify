const SpotifyWebApi = require('spotify-web-api-node'),
    rejson = require('redis-rejson'),
    redis = require('redis'),
    open = require('open'),
    http = require('http'),
    url = require('url');

const secret = require('./secret.json');

var spotifyApi = new SpotifyWebApi(secret);

rejson(redis);
let rc = redis.createClient();

function authorize() {
    var scopes = ['user-read-private', 'user-library-read', 'user-follow-read'];
    var state = 'some-state';

    const hostname = 'localhost';
    const port = 8888;

    var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);

    const server = http.createServer((req, res) => {
        var q = url.parse(req.url, true).query;
        res.write('OK');
        res.end();
        main(q.code);
    });

    server.listen(port, hostname, () => {
        console.log(`Server running at http://${hostname}:${port}/`);
    });

    open(authorizeURL);
}

async function get_saved_artists() {
    let total = 3333;
    let N = 20;
    let after;
    let i = 0;

    while (i < total) {
        await spotifyApi.getFollowedArtists({
            limit : N,
            after: after
        })
        .then(function(data) {
            total = data.body.artists.total;
            after = data.body.artists.cursors.after;
            for (const a of data.body.artists.items) {
                console.log(a.name);
                rc.json_set('artists.' + a.id, '.', JSON.stringify(a), (err) => {
                    if (err) { throw err; }
                });
                i++;
            }
        })
        .catch(function(err) {
            console.log('Something went wrong!', JSON.stringify(err));
        });
    }
    console.log('artist count -- server:', total, 'us:', i);
}

async function get_saved_albums() {
    let total = 3333;
    let offset = 0;
    let N = 25;
    let i = 0;

    while (offset <= total) {
        await spotifyApi.getMySavedAlbums({
            limit : N,
            offset: offset
        })
        .then(function(data) {
            total = data.body.total;
            offset = offset + N;
            for (const a of data.body.items) {
                console.log(a.album.name);
                rc.json_set('albums.' + a.album.id, '.', JSON.stringify(a), (err) => {
                    if (err) { throw err; }
                });
                i++;
            }
        })
        .catch(function(err) {
            console.log('Something went wrong!', JSON.stringify(err));
        });
    }
    console.log('albums count -- server:', total, 'us:', i);
}

async function get_saved_tracks() {
    let total = 3333;
    let offset = 0;
    let N = 50;
    let i = 0;

    while (offset <= total) {
        await spotifyApi.getMySavedTracks({
            limit : N,
            offset: offset
        })
        .then(function(data) {
            total = data.body.total;
            offset = offset + N;
            for (const s of data.body.items) {
                console.log(s.track.name);
                rc.json_set('songs.' + s.track.id, '.', JSON.stringify(s), (err) => {
                    if (err) { throw err; }
                });
                i++;
            }
        })
        .catch(function(err) {
            console.log('Something went wrong!', JSON.stringify(err));
        });
    }
    console.log('tracks count -- server:', total, 'us:', i);
}

function main(code) {
    spotifyApi.authorizationCodeGrant(code).then(
        function(data) {
            console.log('The token expires in ' + data.body['expires_in']);
            console.log('The access token is ' + data.body['access_token']);
            console.log('The refresh token is ' + data.body['refresh_token']);
            // Set the access token on the API object to use it in later calls
            spotifyApi.setAccessToken(data.body['access_token']);
            spotifyApi.setRefreshToken(data.body['refresh_token']);
    })
    .then(() => {
        // save redis database every minute
        rc.config("set", "save", "60 1");
    })
    .then(async () => await get_saved_tracks())
    .then(async () => await get_saved_albums())
    .then(async () => await get_saved_artists())
    .then(() => {rc.save()})
    .then(() => {rc.quit()})
    .then(() => {
        console.log('Done');
        process.exit(0);
    })
    .catch(function(err) {
        console.log('something went wrong!', JSON.stringify(err));
    });
}

authorize();
