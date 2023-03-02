import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

const beans = express.Router();
const HOMEGROUND_URL =
  'https://homegroundcoffeeroasters.com/collections/filter-coffee';
const ALCHEMIST_URL = 'https://alchemist.com.sg/shop-coffee-beans/filter';

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
      updateResults(name, price, url, status, results);
    });
    response.status(200).json(results);
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
});

beans.get('/alchemist', async (request, response, next) => {
  try {
    const { data } = await axios.get(ALCHEMIST_URL);
    const $ = cheerio.load(data);
    const listItems = $('.hentry');
    let results: string[][] = []!;
    listItems.each((index, element) => {
      let name: string = $(element)
        .children('.grid-meta-wrapper')
        .children('.grid-main-meta')
        .children('.grid-title')
        .text()
        .trim();
      let price: string = $(element)
        .children('.grid-meta-wrapper')
        .children('.grid-main-meta')
        .children('.grid-prices')
        .text()
        .trim()
        .replace(/from/g, '')
        .trim();
      let url: string = $(element).children('.grid-item-link').attr('href')!;
      let status: string =
        $(element)
          .children('.grid-meta-wrapper')
          .children('.grid-meta-status')
          .children('.product-mark')
          .text()
          .trim() || 'Available';
      updateResults(name, price, url, status, results);
    });
    response.status(200).json(results);
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
});

const updateResults = (
  name: string,
  price: string,
  url: string,
  status: string,
  results
) => {
  if (status === 'Available') {
    results.push([name, price, url, status]);
  }
};

export default beans;
