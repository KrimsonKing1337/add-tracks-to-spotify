let bands = new Set();
let nodes = [...document.querySelectorAll('.d-collection > a')];

nodes.forEach((nodeCur) => {
  const name = nodeCur.firstChild.textContent;

  bands.add(name);
});

let arr = Array.from(bands);

console.log(arr.join('\n'));
