let ArrayTracks = [];
let tempArrayTracks = [...document.querySelectorAll('.flex-columns')];

tempArrayTracks.forEach((trackItem) => {
  let trackName = '';
  let trackAuthor = '';

  const tempTrackName = trackItem.querySelector('yt-formatted-string');

  if (tempTrackName) {
    trackName = tempTrackName.getAttribute('title');
  }

  const tempTrackAuthor = trackItem.querySelector('.secondary-flex-columns > yt-formatted-string');

  if (tempTrackAuthor) {
    trackAuthor = tempTrackAuthor.getAttribute('title');
  }

  const fullNameTrack = trackAuthor + ' - ' + trackName;

  ArrayTracks.push(fullNameTrack);
});

console.log(ArrayTracks.join('\n'));
