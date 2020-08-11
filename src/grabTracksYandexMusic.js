window.scrollTo(0, 0);

let scrollEnable = true;
let collection = new Set();
let windowHeight = window.innerHeight;
let scrollStep = 1;

function getTracks() {
  const trackElements = [...document.querySelectorAll('.d-track')];

  trackElements.forEach((trackElementCur) => {
    if (trackElementCur.classList.contains('d-track_podcast')) {
      return;
    }

    const trackName = trackElementCur.querySelector('.d-track__title').firstChild.textContent;
    const trackVersionElement = trackElementCur.querySelector('.d-track__version');
    const trackVersion = trackVersionElement ? trackVersionElement.firstChild.textContent : '';
    const artistName = [...trackElementCur.querySelector('.d-track__artists').childNodes]
      .map(cur => cur.firstChild.textContent)
      .join('');
    let name = `${artistName} - ${trackName}`;

    if (trackVersion) {
      name += ` (${trackVersion})`;
    }

    collection.add(name);
  });
}

function onLoad(e) {
  if (e.target.responseURL.indexOf('track-entries.jsx') === -1) {
    return;
  }

  getTracks();

  scrollEnable = true;
}

function onError() {
  console.error(`Произошла ошибка при получении новой порции треков. 
  Перезагрузите страницу и попробуйте ещё раз (ошибка не со стороны данного скрипта)`);
}

XMLHttpRequest.prototype.realSend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send = function (value) {
  scrollEnable = false;
  this.addEventListener('load', onLoad, false);
  this.addEventListener('error', onError, false);
  this.addEventListener('abort', onError, false);
  this.realSend(value);
};

function scroll() {
  const interval = setInterval(() => {
    if (scrollEnable === false) {
      return;
    }

    window.scrollTo(0, windowHeight * scrollStep);
    scrollStep++;

    if ((windowHeight + window.scrollY) >= document.body.scrollHeight) {
      clearInterval(interval);

      let arr = Array.from(collection);
      console.log(arr.join('\n'));
    }
  }, 300);
}

function start() {
  getTracks();
  scroll();
}

console.clear();

start();
