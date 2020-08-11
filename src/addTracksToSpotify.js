const axios = require('axios');
const fs = require('fs');

// todo: подумать как добавлять исполнителей без треков

class AddTracksToSpotify {
  constructor(accessToken, tracks) {
    if (!accessToken) {
      throw new Error('accessToken is required!');
    }

    return (async () => {
      this.accessToken = accessToken;
      this.userId = null;
      this.playlistId = null;
      this.tracks = tracks;
      this.tracksWasNotFound = [];
      this.tracksTimeout = [];
      this.tracksAsSpotifyUri = [];

      await this.setUserId();
      await this.setTracksAsSpotifyUri();
      await this.createPlaylist();

      return this;
    })();
  }

  async setUserId() {
    console.log('Getting user id...');

    const respMe = await axios.get('https://api.spotify.com/v1/me/', {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    })
      .catch((err) => {
        console.error(err);
        process.exit(-1);
      });

    this.userId = respMe.data.id;

    console.log(`Success! User id is ${this.userId}`);
  }

  async trackSearch(str) {
    const respTrackSearch = await axios.get(`https://api.spotify.com/v1/search?q=${str}&type=track&limit=1`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
      .catch((err) => {
        console.error(err);
      });

    return respTrackSearch ? respTrackSearch.data.tracks.items[0] : null;
  }

  async createPlaylist() {
    console.log('Creating playlist...');

    const respCreatePlaylist = await axios.post(`https://api.spotify.com/v1/users/${this.userId}/playlists`, {
        'name': 'Playlist',
        'description': '',
        'public': false
      },
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })
      .catch((err) => {
        console.error(err);
        process.exit(-1);
      });

    this.playlistId = respCreatePlaylist.data.id;

    console.log(`Success! Playlist id is ${this.playlistId}`);
  }

  async addToPlaylist(arr) {
    console.log('Adding tracks to playlist...');

    const tracks = arr.join(',');

    await axios.post(`https://api.spotify.com/v1/playlists/${this.playlistId}/tracks?uris=${tracks}`,
      null,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      .catch((err) => {
        console.error(err);
        process.exit(-1);
      });

    console.log('Success!');
  }

  async setTracksAsSpotifyUri() {
    console.log(`Making ${this.tracks.length} track(s) as spotify uri...`);

    for (let i = 0; i < this.tracks.length; i++) {
      const trackCur = this.tracks[i].replace(/[\r\n]/g, '');

      if (!trackCur) {
        continue;
      }

      const trackCurSafe = encodeURIComponent(trackCur);

      const trackFromSearch = await this.trackSearch(trackCurSafe);

      if (!trackFromSearch) {
        if (trackFromSearch === null) {
          this.tracksTimeout.push(trackCur);
        } else {
          this.tracksWasNotFound.push(trackCur);
        }

        console.error(`Step #${i + 1}: track ${trackCur} was NOT found`);
      } else {
        console.log(`Step #${i + 1}: track ${trackCur} was found`);

        this.tracksAsSpotifyUri.push(trackFromSearch.uri);
      }
    }

    console.log('Success!');
  }

  async addAllTracks() {
    const chunks = [];

    for (let i = 0; i < this.tracksAsSpotifyUri.length; i += 100) {
      chunks.push(this.tracksAsSpotifyUri.slice(i, 100 + i));
    }

    for (let i = 0; i < chunks.length; i++) {
      const chunkCur = chunks[i];

      await this.addToPlaylist(chunkCur);
    }
  }
}

const accessToken = '';

const pathToFileWithTracks = './tracks.txt';

(async () => {
  if (!pathToFileWithTracks) {
    throw new Error('pathToFileWithTracks is required!');
  }

  const file = fs.readFileSync(pathToFileWithTracks);
  const tracks = file.toString().split('\n');

  const inst = await new AddTracksToSpotify(accessToken, tracks);

  await inst.addAllTracks();

  if (inst.tracksTimeout.length > 0) {
    console.log('Trying to search tracks which was not found due request timeout...');

    inst.tracksAsSpotifyUri = [];
    inst.tracks = [...inst.tracksTimeout];

    await inst.setTracksAsSpotifyUri();
    await inst.addAllTracks();
  }

  if (inst.tracksWasNotFound.length > 0) {
    console.log(`There are ${inst.tracksWasNotFound.length} tracks which was no found`);

    fs.writeFileSync('./spotify-tracks-no-found.txt', inst.tracksWasNotFound.join('\n'));
  }
})();
