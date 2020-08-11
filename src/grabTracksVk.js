let tracks = new Set();
let nodes = [...document.querySelectorAll('.audio_row')];

nodes.forEach((nodeCur) => {
  const trackName = nodeCur.querySelector('.audio_row__title_inner').firstChild.textContent;
  const bandName = nodeCur.querySelector('.audio_row__performers > a').firstChild.textContent;
  const name = `${bandName} - ${trackName}`;

  tracks.add(name);
});

let arr = Array.from(tracks);

console.log(arr.join('\n'));
