import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, setConfig, isConfigured } from './config.js';
import {
  trackEvent,
  trackPageView,
  trackProduct,
  trackCart,
  trackOrder,
  trackUser,
  trackCustom,
  trackBatch
} from './api.js';

const program = new Command();

// ============================================================
// Helpers
// ============================================================

function printSuccess(message) {
  console.log(chalk.green('✓') + ' ' + message);
}

function printError(message) {
  console.error(chalk.red('✗') + ' ' + message);
}

function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

async function withSpinner(message, fn) {
  const spinner = ora(message).start();
  try {
    const result = await fn();
    spinner.stop();
    return result;
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

function requireAuth() {
  if (!isConfigured()) {
    printError('Not configured.');
    console.log('\nRun the following to configure:');
    console.log(chalk.cyan('  jirafe config set --site-id YOUR_SITE_ID --token YOUR_TOKEN'));
    process.exit(1);
  }
}

// ============================================================
// Program metadata
// ============================================================

program
  .name('jirafe')
  .description(chalk.bold('Jirafe Events CLI') + ' - Analytics and event tracking from your terminal')
  .version('1.0.0');

// ============================================================
// CONFIG
// ============================================================

const configCmd = program.command('config').description('Manage CLI configuration');

configCmd
  .command('set')
  .description('Set configuration values')
  .option('--site-id <id>', 'Jirafe site ID')
  .option('--token <token>', 'API token')
  .action((options) => {
    if (options.siteId) {
      setConfig('siteId', options.siteId);
      printSuccess('Site ID set');
    }
    if (options.token) {
      setConfig('apiToken', options.token);
      printSuccess('API token set');
    }
    if (!options.siteId && !options.token) {
      printError('No options provided. Use --site-id or --token');
    }
  });

configCmd
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const siteId = getConfig('siteId');
    const token = getConfig('apiToken');
    console.log(chalk.bold('\nJirafe CLI Configuration\n'));
    console.log('Site ID: ', siteId || chalk.red('not set'));
    console.log('Token:   ', token ? chalk.green(token.substring(0, 4) + '...' + token.slice(-4)) : chalk.red('not set'));
    console.log('');
  });

// ============================================================
// TRACK
// ============================================================

const trackCmd = program.command('track').description('Track events');

trackCmd
  .command('pageview <url>')
  .description('Track a page view')
  .option('--title <title>', 'Page title')
  .option('--referrer <referrer>', 'Referrer URL')
  .option('--json', 'Output as JSON')
  .action(async (url, options) => {
    requireAuth();
    try {
      const data = await withSpinner('Tracking page view...', () =>
        trackPageView({
          url,
          title: options.title,
          referrer: options.referrer
        })
      );

      if (options.json) {
        printJson(data);
        return;
      }

      printSuccess('Page view tracked');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

trackCmd
  .command('product <action> <productId>')
  .description('Track product event (view, add_to_cart, purchase)')
  .option('--name <name>', 'Product name')
  .option('--price <price>', 'Product price')
  .option('--json', 'Output as JSON')
  .action(async (action, productId, options) => {
    requireAuth();
    try {
      const data = await withSpinner(`Tracking product ${action}...`, () =>
        trackProduct(action, {
          product_id: productId,
          name: options.name,
          price: options.price ? parseFloat(options.price) : undefined
        })
      );

      if (options.json) {
        printJson(data);
        return;
      }

      printSuccess(`Product ${action} tracked`);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

trackCmd
  .command('cart <action>')
  .description('Track cart event (add, remove, checkout)')
  .option('--items <items>', 'Cart items as JSON')
  .option('--total <total>', 'Cart total')
  .option('--json', 'Output as JSON')
  .action(async (action, options) => {
    requireAuth();
    try {
      const eventData = {
        total: options.total ? parseFloat(options.total) : undefined
      };
      if (options.items) {
        eventData.items = JSON.parse(options.items);
      }

      const data = await withSpinner(`Tracking cart ${action}...`, () =>
        trackCart(action, eventData)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      printSuccess(`Cart ${action} tracked`);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

trackCmd
  .command('order <orderId>')
  .description('Track an order/purchase')
  .option('--total <total>', 'Order total')
  .option('--items <items>', 'Order items as JSON')
  .option('--json', 'Output as JSON')
  .action(async (orderId, options) => {
    requireAuth();
    try {
      const eventData = {
        order_id: orderId,
        total: options.total ? parseFloat(options.total) : undefined
      };
      if (options.items) {
        eventData.items = JSON.parse(options.items);
      }

      const data = await withSpinner('Tracking order...', () =>
        trackOrder(eventData)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      printSuccess('Order tracked');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

trackCmd
  .command('user <action> <userId>')
  .description('Track user event (login, signup, update)')
  .option('--email <email>', 'User email')
  .option('--name <name>', 'User name')
  .option('--json', 'Output as JSON')
  .action(async (action, userId, options) => {
    requireAuth();
    try {
      const data = await withSpinner(`Tracking user ${action}...`, () =>
        trackUser(action, {
          user_id: userId,
          email: options.email,
          name: options.name
        })
      );

      if (options.json) {
        printJson(data);
        return;
      }

      printSuccess(`User ${action} tracked`);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

trackCmd
  .command('custom <eventType> <data>')
  .description('Track custom event with JSON data')
  .option('--json', 'Output as JSON')
  .action(async (eventType, data, options) => {
    requireAuth();
    try {
      const eventData = JSON.parse(data);
      const result = await withSpinner(`Tracking ${eventType}...`, () =>
        trackCustom(eventType, eventData)
      );

      if (options.json) {
        printJson(result);
        return;
      }

      printSuccess('Custom event tracked');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// Parse
// ============================================================

program.parse(process.argv);

if (process.argv.length <= 2) {
  program.help();
}
