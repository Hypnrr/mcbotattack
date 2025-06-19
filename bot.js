const mineflayer = require('mineflayer');
const chalk = require('chalk');
const vec3 = require('vec3');

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

// Cool ASCII Art
const BANNER = `
╔═══════════════════════════════════════════╗
║   🤖 MINECRAFT BOT JOINER 🌍   ║
╚═══════════════════════════════════════════╝`;

// Emojis for different events
const EMOJIS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  bot: '🤖',
  connect: '🔌',
  chat: '💬',
  server: '🌐'
};

// Comprehensive Bot Action System
class BotActionManager {
  static async performRandomMovement(bot) {
    const movements = [
      () => bot.setControlState('sprint', true),
      () => bot.setControlState('jump', true),
      () => bot.setControlState('forward', true),
      () => bot.setControlState('back', true),
      () => bot.setControlState('left', true),
      () => bot.setControlState('right', true)
    ];
    const randomMovement = movements[Math.floor(Math.random() * movements.length)];
    randomMovement();
  }

  static async exploreNearby(bot) {
    const entities = Object.values(bot.entities);
    if (entities.length > 0) {
      const randomEntity = entities[Math.floor(Math.random() * entities.length)];
      bot.lookAt(randomEntity.position);
      
      // Optional: Move towards the entity
      if (randomEntity.position) {
        bot.navigate.to(randomEntity.position);
      }
    }
  }

  static async interactWithWorld(bot) {
    const interactions = [
      () => {
        // Look around randomly
        const yaw = Math.random() * Math.PI * 2;
        const pitch = (Math.random() - 0.5) * Math.PI;
        bot.look(yaw, pitch, true);
      },
      () => {
        // Select random inventory slot
        if (bot.inventory) {
          const randomSlot = Math.floor(Math.random() * bot.inventory.slots.length);
          bot.selectSlot(randomSlot);
        }
      },
      () => {
        // Drop random item
        const items = bot.inventory.items();
        if (items.length > 0) {
          const randomItem = items[Math.floor(Math.random() * items.length)];
          bot.toss(randomItem.type, null, randomItem.count);
        }
      }
    ];
    const randomInteraction = interactions[Math.floor(Math.random() * interactions.length)];
    randomInteraction();
  }

  static async sendRandomChat(bot) {
    const chats = [
      'Hello server!',
      'Anyone here?',
      'Cool server!',
      'Just chilling',
      'Bot life!'
    ];
    const randomChat = chats[Math.floor(Math.random() * chats.length)];
    bot.chat(randomChat);
  }

  static async executeRandomCommand(bot) {
    const commands = [
      '/help',
      '/spawn',
      '/kit',
      '/balance',
      '/list'
    ];
    const randomCommand = commands[Math.floor(Math.random() * commands.length)];
    bot.chat(randomCommand);
  }

  static async performComplexAction(bot) {
    const complexActions = [
      async () => {
        // Find and dig nearest block
        const block = bot.findBlock({ maxDistance: 5 });
        if (block) {
          await bot.dig(block);
        }
      },
      async () => {
        // Place a block if possible
        const referenceBlock = bot.findBlock({ maxDistance: 5 });
        if (referenceBlock) {
          const direction = Object.keys(vec3)[Math.floor(Math.random() * 6)];
          const placementBlock = referenceBlock.position.plus(vec3[direction]);
          const item = bot.inventory.items().find(item => bot.canPlaceBlock(item, referenceBlock));
          if (item) {
            await bot.placeBlock(referenceBlock, vec3[direction]);
          }
        }
      }
    ];
    const randomComplexAction = complexActions[Math.floor(Math.random() * complexActions.length)];
    await randomComplexAction();
  }

  static async performRandomAction(bot) {
    const actions = [
      this.performRandomMovement,
      this.exploreNearby,
      this.interactWithWorld,
      this.sendRandomChat,
      this.executeRandomCommand,
      this.performComplexAction
    ];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    await randomAction(bot);
  }
}

// Ultra-fast username generator
function generateRandomUsername() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(
    {length: 8}, 
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

function printBanner() {
  console.log(chalk.cyan(BANNER));
  console.log(chalk.yellow('=' .repeat(50)));
}

function ask(query) {
  return new Promise(resolve => readline.question(chalk.green(query), resolve));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function connectBot(host, port, username, botAction) {
  return new Promise((resolve, reject) => {
    const createBot = () => {
      const botOptions = {
        host,
        username,
        version: '1.8.9',
        auth: 'offline',
        checkTimeoutInterval: 5,
        connectTimeout: 5,
        disableChatSigning: true,
        skipValidation: true
      };

      // Only add port if it's provided
      if (port) {
        botOptions.port = parseInt(port);
      }

      const bot = mineflayer.createBot(botOptions);

      const timeout = setTimeout(() => {
        bot.end();
        reject(new Error('Connection timeout'));
      }, 2000);

      bot.on('spawn', () => {
        clearTimeout(timeout);
        
        // Send optional action after spawn
        if (botAction) {
          setTimeout(() => {
            try {
              bot.chat(botAction.startsWith('/') ? botAction : botAction);
            } catch {}
          }, 100);
        }

        resolve(bot);
      });

      bot.on('error', (err) => {
        clearTimeout(timeout);
        bot.end();
        reject(err);
      });

      // Auto-reconnect logic
      bot.on('end', async (reason) => {
        console.log(chalk.yellow(`${EMOJIS.warning} ${username} disconnected. Reason: ${reason}. Reconnecting...`));
        await sleep(Math.random() * 2000 + 1000);
        createBot();
      });

      return bot;
    };

    return createBot();
  });
}

(async () => {
  // Clear console and print banner
  console.clear();
  printBanner();

  const serverInput = process.argv[2] || await new Promise(resolve => 
    readline.question('Server IP (domain[:port]): ', resolve)
  );
  
  // Split host and port, handling cases with or without port
  const [host, port] = serverInput.includes(':') 
    ? serverInput.split(':') 
    : [serverInput, null];

  const numBots = parseInt(process.argv[3] || await new Promise(resolve => 
    readline.question('Number of bots: ', resolve)
  ));

  const botAction = process.argv[4] || await new Promise(resolve => 
    readline.question('Optional chat/command (blank to skip): ', resolve)
  );

  console.log(chalk.yellow('=' .repeat(50)));
  console.log(chalk.cyan(`${EMOJIS.server} Connecting to ${host}${port ? `:${port}` : ''}`));
  console.log(chalk.yellow('=' .repeat(50)));

  const start = Date.now();
  let successfulBots = 0;
  let failedBots = 0;

  const connectBots = async () => {
    const connections = [];
    const maxConcurrent = 50;  // Aggressive concurrent connection

    for (let i = 0; i < numBots; i++) {
      // Manage concurrent connections
      if (connections.length >= maxConcurrent) {
        await Promise.race(connections);
      }

      const username = generateRandomUsername();
      
      const botPromise = connectBot(host, port, username, botAction)
        .then(bot => {
          successfulBots++;
          return bot;
        })
        .catch(() => {
          failedBots++;
        });

      connections.push(botPromise);
    }

    return Promise.allSettled(connections);
  };

  const results = await connectBots();
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  const endTime = Date.now();
  console.log(chalk.yellow('=' .repeat(50)));
  console.log(chalk.green(`${EMOJIS.success} Initial Bot Connection Complete!`));
  console.log(chalk.cyan(`⏱️  Total Time: ${(endTime - start) / 1000} seconds`));
  console.log(chalk.green(`${EMOJIS.bot} Successful Bots: ${successful}`));
  console.log(chalk.red(`${EMOJIS.error} Failed Bots: ${failed}`));
  console.log(chalk.yellow('=' .repeat(50)));
  console.log(chalk.yellow('Bots will automatically reconnect if disconnected...'));

  // Keep script running indefinitely
  await new Promise(() => {});
})(); 