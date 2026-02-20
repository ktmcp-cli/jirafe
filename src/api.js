import axios from 'axios';
import { getConfig } from './config.js';

const BASE_URL = 'https://event.jirafe.com/v2';

function getClient() {
  const siteId = getConfig('siteId');
  const apiToken = getConfig('apiToken');

  if (!siteId || !apiToken) {
    throw new Error('Not configured. Run: jirafe config set --site-id YOUR_SITE_ID --token YOUR_TOKEN');
  }

  return axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    }
  });
}

async function request(method, endpoint, data = null) {
  const client = getClient();
  try {
    const response = await client.request({
      method,
      url: endpoint,
      data
    });
    return response.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(`Request failed: ${error.message}`);
  }
}

// Events
export async function trackEvent(eventType, eventData) {
  const siteId = getConfig('siteId');
  return await request('POST', `/${siteId}/events`, {
    type: eventType,
    ...eventData
  });
}

export async function trackPageView(data) {
  return await trackEvent('pageview', data);
}

export async function trackProduct(action, data) {
  return await trackEvent(`product_${action}`, data);
}

export async function trackCart(action, data) {
  return await trackEvent(`cart_${action}`, data);
}

export async function trackOrder(data) {
  return await trackEvent('order', data);
}

export async function trackUser(action, data) {
  return await trackEvent(`user_${action}`, data);
}

export async function trackCustom(eventType, data) {
  return await trackEvent(eventType, data);
}

// Batch events
export async function trackBatch(events) {
  const siteId = getConfig('siteId');
  return await request('POST', `/${siteId}/batch`, { events });
}

// Analytics
export async function getAnalytics(params = {}) {
  const siteId = getConfig('siteId');
  return await request('GET', `/${siteId}/analytics`, params);
}

export async function getStats(params = {}) {
  const siteId = getConfig('siteId');
  return await request('GET', `/${siteId}/stats`, params);
}
