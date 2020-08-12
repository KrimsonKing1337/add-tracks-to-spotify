const axios = require('axios');
const fs = require('fs');

class AddArtistsToSpotify {
  constructor(accessToken, artists) {
    if (!accessToken) {
      throw new Error('accessToken is required!');
    }

    return (async () => {
      this.accessToken = accessToken;
      this.userId = null;
      this.artists = artists;
      this.artistsWasNotFound = [];
      this.artistsTimeout = [];
      this.artistsAsSpotifyId = [];

      await this.setUserId();
      await this.setArtistsAsSpotifyUri();

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

  async artistSearch(str) {
    const respArtistSearch = await axios.get(`https://api.spotify.com/v1/search?q=${str}&type=artist&limit=1`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
      .catch((err) => {
        console.error(err);
      });

    return respArtistSearch ? respArtistSearch.data.artists.items[0] : null;
  }

  async setArtistsAsSpotifyUri() {
    console.log(`Making ${this.artists.length} artist(s) as spotify uri...`);

    for (let i = 0; i < this.artists.length; i++) {
      const artistCur = this.artists[i].replace(/[\r\n]/g, '');

      if (!artistCur) {
        continue;
      }

      const artistCurSafe = encodeURIComponent(artistCur);

      const artistFromSearch = await this.artistSearch(artistCurSafe);

      if (!artistFromSearch) {
        if (artistFromSearch === null) {
          this.artistsTimeout.push(artistCur);
        } else {
          this.artistsWasNotFound.push(artistCur);
        }

        console.error(`Step #${i + 1}: artist ${artistCur} was NOT found`);
      } else {
        console.log(`Step #${i + 1}: artist ${artistCur} was found`);

        this.artistsAsSpotifyId.push(artistFromSearch.id);
      }
    }

    console.log('Success!');
  }

  async addArtists(arr) {
    console.log('Adding artist(s) to your account...');

    const artists = arr.join(',');

    await axios.put(`https://api.spotify.com/v1/me/following/?type=artist&ids=${artists}`,
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

  async addAllArtists() {
    const chunks = [];

    for (let i = 0; i < this.artistsAsSpotifyId.length; i += 50) {
      chunks.push(this.artistsAsSpotifyId.slice(i, 50 + i));
    }

    for (let i = 0; i < chunks.length; i++) {
      const chunkCur = chunks[i];

      await this.addArtists(chunkCur);
    }
  }
}

const accessToken = '';

const pathToFileWithArtists = './artists.txt';

(async () => {
  if (!pathToFileWithArtists) {
    throw new Error('pathToFileWithArtists is required!');
  }

  const file = fs.readFileSync(pathToFileWithArtists);
  const artists = file.toString().split('\n');

  const inst = await new AddArtistsToSpotify(accessToken, artists);

  await inst.addAllArtists();

  if (inst.artistsTimeout.length > 0) {
    console.log('Trying to search artists which was not found due request timeout...');

    inst.artistsAsSpotifyUri = [];
    inst.artists = [...inst.artistsTimeout];

    await inst.setArtistsAsSpotifyUri();
    await inst.addAllArtists();
  }

  if (inst.artistsWasNotFound.length > 0) {
    console.log(`There are ${inst.artistsWasNotFound.length} artists which was no found`);

    fs.writeFileSync('./spotify-artists-no-found.txt', inst.artistsWasNotFound.join('\n'));
  }
})();
