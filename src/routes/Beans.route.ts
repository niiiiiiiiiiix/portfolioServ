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
    const listOfBeans = await axios.get(HOMEGROUND_URL);
    const $ = cheerio.load(listOfBeans.data);
    const listItems = $('.grid-product__link')
      .get()
      .map((bean) => $(bean).attr('href'));
    const fullDetails = await fetchFullDetails(listItems);
    response.status(200).json(fullDetails);
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
});

const fetchFullDetails = async (listItems) => {
  const finalArray = [];
  for (let i = 0; i < listItems.length; i++) {
    const itemUrl = 'https://homegroundcoffeeroasters.com' + listItems[i];
    const allDetails = await axios.get(itemUrl);
    const $ = cheerio.load(allDetails.data);
    const itemName: string = $('.product-single__title').text().trim();
    const getData = $('.shogun-heading-component > h1')
      .get()
      .map((x) => $(x).text().replace(/[\n]/g, '').trim());
    const tastingNotes: string = getData[1];
    const coffee: string = getData[3];
    const region: string = getData[5];
    const origin: string = getData[7];
    const process: string = getData[9];
    const varietal: string = getData[11];
    const weightPriceMap: { [itemWeight: string]: string } = {};
    const getSomeData = JSON.parse($('textarea').text().trim());
    for (const data of getSomeData) {
      let itemWeight = data.title;
      let itemPrice = convertValue(data.price / 100);
      weightPriceMap[itemWeight] = itemPrice;
    }
    finalArray.push({
      itemName: itemName,
      itemUrl: itemUrl,
      tastingNotes: tastingNotes,
      coffee: coffee,
      region: region,
      origin: origin,
      process: process,
      varietal: varietal,
      weightPriceMap,
    });
  }
  return finalArray;
};

const convertValue = (value) => {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: 2,
  }).format(value);
};

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
