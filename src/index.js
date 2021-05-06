require('dotenv').config();

const puppeteer = require('puppeteer');
const fileSystem = require('fs');
const user = process.env.USER;
const password = process.env.PASSWORD;
const search = 'The Simpsons';

const crawler = async () => {
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();

    console.log('Login...');
    await page.goto('http://legendas.tv/login');

    console.log('Type login info...');
    await page.type('#UserUsername', user);
    await page.type('#UserPassword', password);
    await page.click('#UserLoginForm .btn');

    console.log('Go to search page...');
    await page.goto(`http://legendas.tv/busca/${search}`, {
        waitUntil: 'load',
        timeout: 0
    });

    await page.waitForSelector('#resultado_busca');

    console.log('Get subtitles...');
    const subtitles = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('#resultado_busca article > div'));

        return items.map(item => {
            const href = item.querySelector('a').href;
            const hash = href.split('/')[4];

            return {
                // change all domcument.queryselector
                Title: item.querySelector('a').innerText,
                Downloads: item.querySelector('section article div div .data').innerText.split(' ')[0],
                Nota: item.querySelector('section article div div .data').innerText.split(' ')[3],
                Creator: item.querySelector('section article div div .data').innerText.split(' ')[6],
                Data: item.querySelector('section article div div .data').innerText.split(' ')[8],
                Idioma: item.querySelector('article div img').alt,
                LinkDownload: `http://legendas.tv/downloadarquivo/${hash}`
            }
        });
    });  
    // include count about obj in search
    let counter = 0;
    for (let i = 0; i < subtitles.length; i++) {
      if (subtitles[i]) counter++;
    }
    //
    console.log('Close browser...');
    // include msg with count 
    console.log("​Foram encontradas "+counter+" legendas");
    browser.close();
    console.log(subtitles);
    return subtitles;
}

crawler()
    .then(subtitles => {
        fileSystem.writeFile('./src/subtitles.json', JSON.stringify(subtitles), error => {
            if (error) throw error;
            console.log('The file has been saved at src/subtitles.json! 💫');
        });
    })
    .catch(error => console.log(error))
