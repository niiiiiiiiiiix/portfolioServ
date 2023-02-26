import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

const beans = express.Router();
const HOMEGROUND_URL =
  'https://homegroundcoffeeroasters.com/collections/filter-coffee';

beans.get('/', (request, response, next) => {
  response.send('Welcome');
});

beans.get('/homeground', async (request, response, next) => {
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
    response.status(200).json(results);
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
});

export default beans;
