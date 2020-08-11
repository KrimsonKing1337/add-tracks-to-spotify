const fs = require('fs');
const axios = require('axios');

class GrabTracksYandexDisk {
  constructor(token, onlyArtists = false) {
    if (!token) {
      throw new Error('token is required!');
    }

    this.token = token;
    this.onlyArtists = onlyArtists;
    this.collection = new Set();
    this.limit = 5000;
    this.offset = 0;
    this.step = 1;
  }

  getBandName(item) {
    const {path} = item;
    let positionOfSlash = path.lastIndexOf('/');
    const pathWithoutTrackName = path.slice(0, positionOfSlash);
    const regExp = /\(([^)]+)\)/;
    const match = pathWithoutTrackName.match(regExp);
    const positionOfParentheses = match === null ? 0 : pathWithoutTrackName.indexOf(match[0]);
    const str = pathWithoutTrackName.slice(0, positionOfParentheses);
    positionOfSlash = str.lastIndexOf('/');
    const bandName = str.slice(positionOfSlash + 1);
    const bandNameWithoutStyle = match === null ? bandName : bandName.replace(match[0], '');
    const positionOfDash = bandNameWithoutStyle.indexOf(' - ');
    const bandNameWithoutAlbum = bandNameWithoutStyle.slice(0, positionOfDash);

    return bandNameWithoutAlbum.trim();
  }

  async get() {
    console.log('getting info...');

    const url = 'https://cloud-api.yandex.net/v1/disk/resources/files';

    const res = await axios.get(url, {
      params: {
        limit: this.limit,
        fields: 'items.name,items.path',
        media_type: 'audio',
        offset: this.offset
      },
      headers: {
        'Authorization': this.token
      }
    });

    return res.data;
  }

  async getAll() {
    console.log(`Iteration #${this.step}`);

    let res;

    try {
      res = await this.get();
    } catch (e) {
      console.error(e);

      return;
    }

    if (res.items && res.items.length > 0) {
      console.log('converting data...');

      for (let i = 0; i < res.items.length; i++) {
        const itemCur = res.items[i];
        let record = null;

        if (this.onlyArtists === true) {
          record = this.getBandName(itemCur);
        } else {
          record = itemCur.name;
        }

        this.collection.add(record);
      }

      console.log(`There is: ${this.collection.size} record(s) in collection`);

      this.offset += this.limit;
      this.step++;

      // await this.getAll();
    }
  }
}

const token = '';
const onlyArtists = false;

const inst = new GrabTracksYandexDisk(token, onlyArtists);

inst.getAll().then(() => {
  const collection = Array.from(inst.collection);

  fs.writeFileSync('collection-yandex-disk.txt', collection.join('\n'));
});


/*
* после экспериментов выяснилось, что треки ищутся гораздо лучше.
* если искать исполнителя или альбом по названию - они часто не находятся,
* хотя если вручную в спотифае искать - то они есть.
* */
