const TelegramBot = require('node-telegram-bot-api');
const _ = require('lodash');
const Promise = require('./lib/Promise');
const CronJob = require('cron').CronJob;

const chatService = require('./chatService');
const apartmentService = require('./apartmentService');
const apartments = require('./apartments');

const token = '681422803:AAGzvGtqchcGJjB37nswmlB9Vq8crncqJG4';
const bot = new TelegramBot(token, { polling: true });

const checkForNewApartments = async () => {
  const prevApartments = await apartmentService.find();
  const updatedApartments = await apartments.getApartments();
  const newApartments = _.differenceBy(updatedApartments, prevApartments, 'id');
  if (newApartments.length > 0) {
    await apartmentService.insert(newApartments);
    const outdatedApartments = _.differenceBy(prevApartments, updatedApartments, 'id');
    try {
      _.each(outdatedApartments, apartment => apartmentService.remove({
        id: apartment.id,
      }))
    } catch (err) {
      console.log('ERROR', err);
    }

    return newApartments;
  }
  return null;
}

const broadcastApartment = async apartment => {
  const chatsToBroadcast = await chatService.find();
  await Promise.each(chatsToBroadcast, async chat => {
    const messageToSend = constructMessage(apartment);
    await bot.sendMessage(chat.id, messageToSend.message);
    await bot.sendPhoto(chat.id, messageToSend.photo);
    // await bot.sendLocation(chat.id, messageToSend.location.latitude, messageToSend.location.longitude);
  });
}

const constructMessage = apartment => {
  const price = _.get(apartment, 'price.converted.USD', apartment.price);
  const address = _.get(apartment, 'location.user_address', 'N/A');

  return {
    message: `====================\n${address}\n$$$(${price.currency}): ${price.amount}\nLink: ${apartment.url}`,
    // location: {
    //   latitude: apartment.location.latitude,
    //   longitude: apartment.location.longitude,
    // },
    photo: apartment.photo,
  };
};

const sendAllApartments = async chatId => {
  const allApartments = await apartmentService.find();
  const resp = _.reduce(allApartments, (acc, next) => `${constructMessage(next).message}\n\n${acc}`, '');
  bot.sendMessage(chatId, resp);
}

// bot.onText(/echo (.+)/, async (msg, match) => {
//   const fromId = msg.from.id;
//   const resp = match[1];
//   bot.sendMessage(fromId, resp);
// });

bot.onText(/\/test/, async (msg, match) => {
  const fromId = msg.from.id;
  bot.sendMessage(fromId, 'I\'m okay!');
});

bot.onText(/\/all/, msg => sendAllApartments(msg.chat.id));

bot.on('message', async msg => {
  const { chat } = msg;

  const isChatExist = await chatService.findOne({ id: chat.id });
  console.log('YI', isChatExist);
  if (!isChatExist) {
    await chatService.insert(chat);
    sendAllApartments(chat.id);
  }
});

const job = new CronJob('0 */5 * * * *', async () => {
  const newApartments = await checkForNewApartments();
  console.log('UPD', new Date());
  console.log('NEW APPARTMENTS', newApartments);
  if (newApartments) {
    await Promise.each(newApartments, apartment => broadcastApartment(apartment))
  }
});
job.start();

