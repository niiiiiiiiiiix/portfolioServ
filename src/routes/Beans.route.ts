import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

const beans = express.Router();
const HOMEGROUND_BASE_URL = 'https://homegroundcoffeeroasters.com';
const HOMEGROUND_FILTER_PATH = '/collections/filter-coffee';
const ALCHEMIST_BASE_URL = 'https://alchemist.com.sg';
const ALCHEMIST_FILTER_PATH = '/shop-coffee-beans/filter';

beans.get('/homeground', async (request, response, next) => {
  try {
    const listOfBeans: axios.AxiosResponse = await axios.get(HOMEGROUND_BASE_URL + HOMEGROUND_FILTER_PATH);
    const $ = cheerio.load(listOfBeans.data);
    const beansPathArray = $('.grid-product__link')
      .get()
      .map((bean) => $(bean).attr('href'));
    const fullDetails = await fetchFullDetails(beansPathArray, HOMEGROUND_BASE_URL);
    response.status(200).json(fullDetails);
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
});

beans.get('/alchemist', async (request, response, next) => {
  try {
    const listOfBeans: axios.AxiosResponse = await axios.get(ALCHEMIST_BASE_URL + ALCHEMIST_FILTER_PATH);
    const $ = cheerio.load(listOfBeans.data);
    const beansPathArray = $('.grid-item')
      .not('.sold-out')
      .get()
      .map((bean) => $(bean).find('.grid-item-link').attr('href'));
    const fullDetails = await fetchFullDetails(beansPathArray, ALCHEMIST_BASE_URL);
    response.status(200).json(fullDetails);
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
});

const fetchFullDetails = async (beansPathArray, baseUrl) => {
  const beansInformation = [];
  for (let i = 0; i < beansPathArray.length; i++) {
    const link: string = baseUrl + beansPathArray[i];
    const content: axios.AxiosResponse = await axios.get(link);
    const $: cheerio.CheerioAPI = cheerio.load(content.data);
    let name: string;
    let details;
    switch (baseUrl) {
      case HOMEGROUND_BASE_URL:
        name = $('.product-single__title').text().trim();
        details = createHomegroundDetailsObject($);
        beansInformation.push({
          name: name,
          link: link,
          details,
        });
        break;
      case ALCHEMIST_BASE_URL:
        name = $('.ProductItem-details-title').text().trim();
        details = createAlchemistDetailsObject($);
        beansInformation.push({
          name: name,
          link: link,
          details,
        });
        break;
      default:
        break;
    }
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

const createHomegroundDetailsObject = ($) => {
  const details: {} = $('.shogun-heading-component > h1')
    .get()
    .map((detail) => $(detail).text().replace(/[\n]/g, '').trim())
    .reduce((detailsObject: {}, currentValue: string, currentIndex: number, array: string[]) => {
      if (currentIndex & 1) {
        detailsObject[convertToCamelCase(array[currentIndex - 1])] = currentValue;
      }
      return detailsObject;
    }, {});
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

const createAlchemistDetailsObject = ($) => {
  const count = $('.ProductItem-details-excerpt > p').length - 3;
  const details = $('.ProductItem-details-excerpt > p')
    .eq(count)
    .get()
    .map((bean) => $(bean).text())
    .reduce((detailsObject: {}, detailString: string) => {
      const individualBeanInfo = ['Process', 'Varietal', 'Region', 'Origin', 'Tasting Notes'];
      if (detailString.indexOf('Origin') === -1) {
        individualBeanInfo.splice(3, 1);
      }
      for (let i = 0; i < individualBeanInfo.length; i++) {
        detailsObject[convertToCamelCase(individualBeanInfo[i])] = getSubstringValue(
          detailString,
          individualBeanInfo[i],
          individualBeanInfo[i + 1]
        );
      }
      return detailsObject;
    }, {});
  return details;
};

const getSubstringValue = (string, start, end = string) => {
  const startOfSubstring = string.indexOf(start) + start.length + 2;
  const endOfSubstring = Math.max(end.length, string.indexOf(end));
  return string.substring(startOfSubstring, endOfSubstring);
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

export default beans;
