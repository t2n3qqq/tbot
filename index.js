const TelegramBot = require('node-telegram-bot-api');
const _ = require('lodash');
const Promise = require('./lib/Promise');

const chatService = require('./chatService');
const apartmentService = require('./apartmentService');
const apartments = require('./apartments');

const token = '681422803:AAGzvGtqchcGJjB37nswmlB9Vq8crncqJG4';
const bot = new TelegramBot(token, { polling: true });

const checkForNewApartments = async () => {
  const prevApartments = await apartmentService.find();
  const updatedApartments = await apartments.getApartments();
  const newApartments = _.differenceBy(updatedApartments, prevApartments, 'id');
  console.log('NEW APPARTMENTS', newApartments);
  if (newApartments.length > 0) {
    await apartmentService.insert(newApartments);
    const outdatedApartments = _.differenceBy(prevApartments, updatedApartments, 'id');
    _.each(outdatedApartments, apartment => apartmentService.remove({
      id: apartment.id,
    }))
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
    await bot.sendLocation(chat.id, messageToSend.location.latitude, messageToSend.location.longitude);
  });
}

const constructMessage = apartment => ({
  message: `Hey! Check it OUT!!!\n${apartment.location.user_address}\n$$$: ${apartment.price.amount}\nLink: ${apartment.url}`,
  location: {
    latitude: apartment.location.latitude,
    longitude: apartment.location.longitude,
  },
  photo: apartment.photo,
});

bot.onText(/echo (.+)/, async (msg, match) => {
  const fromId = msg.from.id;
  const resp = match[1];
  bot.sendMessage(fromId, resp);
});

bot.onText(/\/test/, async (msg, match) => {
  const fromId = msg.from.id;
  bot.sendMessage(fromId, 'I\'m okay!');
});

bot.onText(/\/all/, async (msg, match) => {
  const fromId = msg.from.id;
  const allApartments = await apartmentService.find();
  const resp = _.reduce(allApartments, (acc, next) => `${constructMessage(next).message}\n\n${acc}`, '');
  bot.sendMessage(fromId, resp);
});

bot.on('message', async msg => {
  const { chat } = msg;

  const isChatExist = await chatService.findOne({ id: chat.id });

  if (!isChatExist) {
    await chatService.insert(chat);
  }
});

setInterval(async () => {
  const newApartments = await checkForNewApartments();
  if (newApartments) {
    await Promise.each(newApartments, apartment => broadcastApartment(apartment))
  }
}, 10 * 60 * 1000);