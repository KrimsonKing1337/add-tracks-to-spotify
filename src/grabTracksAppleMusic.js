let tracks = new Set();
let nodes = [...document.querySelectorAll('.song')];

nodes.forEach((nodeCur) => {
  const trackName = nodeCur.querySelector('.song-name').textContent.trim();
  const bandName = nodeCur.querySelector('.by-line > a').textContent.trim();
  const name = `${bandName} - ${trackName}`;

  tracks.add(name);
});

let arr = Array.from(tracks);

console.log(arr.join('\n'));
