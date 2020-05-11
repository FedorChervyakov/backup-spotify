# Backup Spotify
Retrieve and record saved albums, songs, artists, playlists and playlist contents.

## `secret.json` format
```json
{
    "clientId": "CLIENT_ID",
    "clientSecret": "CLIENT_SECRET",
    "redirectUri": "REDIRECT_URI"
}
```

## TODO
- [ ] Add some sort of parser to extract only relevant info from the database.
- [ ] Add Usage section to the Readme.
- [ ] Take userId from somewhere, for example from environmental variable or other.
- [ ] Dockerize, i.e. run the app in a docker container. Write a Dockerfile and init script basically.
- [ ] Make the app usable as submodule. One usage scenario might be as follows: the user initializes empty git repo, adds this repo as submodule, runs an init script that runs a Docker container and possibly builds the image, and saves the results in top-level folder.
