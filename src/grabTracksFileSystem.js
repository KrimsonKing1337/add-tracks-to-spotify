const fs = require('fs');
const path = require('path');

class GrabTracksFileSystem {
  constructor(rootPath, mask = ['.mp3'], onlyArtists = false) {
    if (!rootPath) {
      throw new Error('rootPath is required!');
    }

    this.rootPath = rootPath;
    this.mask = mask;
    this.onlyArtists = onlyArtists;
    this.collection = new Set();
    this.step = 1;
  }

  getBandName(item) {
    // path.sep is '\' or '/', depends of OS
    let positionOfSlash = item.lastIndexOf(path.sep);
    const pathWithoutTrackName = item.slice(0, positionOfSlash);
    const regExp = /\(([^)]+)\)/;
    const match = pathWithoutTrackName.match(regExp);
    const positionOfParentheses = match === null ? 0 : pathWithoutTrackName.indexOf(match[0]);
    const str = pathWithoutTrackName.slice(0, positionOfParentheses);
    positionOfSlash = str.lastIndexOf(path.sep);
    const bandName = str.slice(positionOfSlash + 1);
    const bandNameWithoutStyle = match === null ? bandName : bandName.replace(match[0], '');
    const positionOfDash = bandNameWithoutStyle.indexOf(' - ');
    const bandNameWithoutAlbum = bandNameWithoutStyle.slice(0, positionOfDash);

    return bandNameWithoutAlbum.trim();
  }

  get(dirPath) {
    return fs.readdirSync(dirPath);
  }

  getAll(dirPath = this.rootPath) {
    console.log(`Iteration #${this.step}`);

    const files = this.get(dirPath);

    for (let i = 0; i < files.length; i++) {
      const fileCur = files[i];
      const fullPath = `${dirPath}/${fileCur}`;

      if (fs.statSync(fullPath).isDirectory()) {
        this.getAll(fullPath);
      } else {
        const ext = path.extname(fileCur);
        let extIsOk = false;

        for (let j = 0; j < this.mask.length; j++) {
          const maskItemCur = this.mask[j];

          if (ext === maskItemCur) {
            extIsOk = true;

            break;
          }
        }

        if (extIsOk === false) {
          this.step++;

          continue;
        }

        let record = null;

        if (this.onlyArtists === true) {
          record = this.getBandName(path.join(__dirname, fullPath));
        } else {
          record = path.basename(fileCur).split('.').slice(0, -1).join('.');
        }

        this.collection.add(record);

        console.log(`There is ${this.collection.size} in collection`);

        this.step++;

        if (this.onlyArtists === true) {
          return;
        }
      }
    }

    return this.collection;
  }
}

const rootPath = 'D:\\Music\\Metal\\Black Folk Viking';
const mask = ['.mp3', '.flac'];
const onlyArtists = false;

const inst = new GrabTracksFileSystem(rootPath, mask, onlyArtists);
const collection = inst.getAll();
const collectionAsArray = Array.from(collection);

fs.writeFileSync('./collection-fs.txt', collectionAsArray.join('\n'));
