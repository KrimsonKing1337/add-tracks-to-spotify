/**
 * @returns {void}
 */
const getTrackListFromYandexMusic = () => {
    if (!externalAPI) {
        throw new Error('Не удалось найти API Yandex music');
    }

    // Включаем playlist чтобы в методе списка появились наши записи
    externalAPI.play();
    // Ставим на паузу, нам же скачать
    externalAPI.togglePause();

    // Получаем список треков текущего плейлиста
    const playlist = externalAPI.getTracksList();

    if (!Array.isArray(playlist) || !playlist.length) {
        throw new Error('Не удалось получить список композиций');
    }

    // Собираем массив объектов {title: '', artist: ''}
    const result = playlist.reduce((previousValue, currentValue, index, array) => {
        previousValue.music.push({
            title: currentValue.title,
            artist: currentValue.artists.map(item => item.title).join(','),
        });

        return previousValue;
    }, { music: [] });

    if (!result || !result.music.length) {
        throw new Error('При формировании списка произошла ошибка');
    }

    // Собираем строки из массива и объеденяем их
    const exportValue = result.music.map(item => `${item.title} - ${item.artist}`).join('\n');
  
    
    console.log('=========== РЕЗУЛЬТАТ ============');
    console.log(exportValue);

    // Chromium браузеры поддеживают метод copy, сделаем удобно
    if (window.copy) {
        copy(exportValue);
        console.log('=======================');
        console.log('Результат скопирован в буфер обмена');
        console.log('=======================');
    }
};

getTrackListFromYandexMusic();