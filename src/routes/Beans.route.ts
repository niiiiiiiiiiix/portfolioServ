import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

const beans = express.Router();
const HOMEGROUND_BASE_URL = 'https://homegroundcoffeeroasters.com';
const HOMEGROUND_FILTER_PATH = '/collections/filter-coffee';
const ALCHEMIST_BASE_URL = 'https://alchemist.com.sg';
const ALCHEMIST_FILTER_PATH = '/shop-coffee-beans/filter';

beans.get('/', (request, response, next) => {
  response.send('Welcome');
});

beans.get('/homeground', async (request, response, next) => {
  try {
    const listOfBeans: axios.AxiosResponse = await axios.get(
      HOMEGROUND_BASE_URL + HOMEGROUND_FILTER_PATH
    );
    const $ = cheerio.load(listOfBeans.data);
    const beansPathArray = $('.grid-product__link')
      .get()
      .map((bean) => $(bean).attr('href'));
    const fullDetails = await fetchFullDetails(beansPathArray);
    response.status(200).json(fullDetails);
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
});

const fetchFullDetails = async (beansPathArray) => {
  const beansInformation = [];
  for (let i = 0; i < beansPathArray.length; i++) {
    const link: string = HOMEGROUND_BASE_URL + beansPathArray[i];
    const content: axios.AxiosResponse = await axios.get(link);
    const $: cheerio.CheerioAPI = cheerio.load(content.data);
    const name: string = $('.product-single__title').text().trim();
    const details = createDetailsObject($);
    beansInformation.push({
      name: name,
      link: link,
      details,
    });
  }
  return beansInformation;
};

const formatPriceData = (value) => {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: 2,
  }).format(value);
};

const createDetailsObject = ($) => {
  const details: {} = $('.shogun-heading-component > h1')
    .get()
    .map((detail) => $(detail).text().replace(/[\n]/g, '').trim())
    .reduce(
      (
        detailsObject: {},
        currentValue: string,
        currentIndex: number,
        array: string[]
      ) => {
        if (currentIndex & 1) {
          detailsObject[convertToCamelCase(array[currentIndex - 1])] =
            currentValue;
        }
        return detailsObject;
      },
      {}
    );
  const pricing: { [weight: string]: string } = {};
  const getTextAreaData = JSON.parse($('textarea').text().trim());
  for (const data of getTextAreaData) {
    let weight = data.title;
    let price = formatPriceData(data.price / 100);
    pricing[weight] = price;
  }
  details['pricing'] = pricing;
  return details;
};

const convertToCamelCase = (string) => {
  const returnArray: string[] = [];
  string.split(' ').forEach((word, index) => {
    if (index === 0) {
      returnArray.push(word.toLowerCase());
    } else {
      returnArray.push(word);
    }
  });
  return returnArray.join('');
};

beans.get('/alchemist', async (request, response, next) => {
  try {
    const { data } = await axios.get(
      ALCHEMIST_BASE_URL + ALCHEMIST_FILTER_PATH
    );
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
