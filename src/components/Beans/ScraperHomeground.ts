import * as cheerio from 'cheerio';
import axios from 'axios';

let HOMEGROUND_URL =
  'https://homegroundcoffeeroasters.com/collections/filter-coffee';

const getHTMLDocument = async () => {
  try {
    const { data } = await axios.get(HOMEGROUND_URL);
    const $ = cheerio.load(data);
    const listItems = $('.grid-product__content');
    let results: string[][] = []!;
    listItems.each((index, element) => {
      let name: string = $(element)
        .children('.grid-product__link')
        .children('.grid-product__meta')
        .children('.grid-product__title')
        .text()
        .trim();
      let price: string = $(element)
        .children('.grid-product__link')
        .children('.grid-product__meta')
        .children('.grid-product__price')
        .text()
        .trim()
        .replace(/from/g, '')
        .trim();
      let url: string = $(element)
        .children('.grid-product__link')
        .attr('href')!;
      let status: string =
        $(element).children('.grid-product__tag').text().trim() || 'Available';
      results.push([name, price, url, status]);
    });
    console.log(results);
    // return results;
  } catch (err) {
    console.log(err);
  }
};

export default getHTMLDocument;
