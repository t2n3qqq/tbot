const Nedb = require('nedb');

class BaseService {
  constructor(service) {
    console.log('SERVICE', service);
    this.service = new Nedb({ filename: `./db/${service}.db`, autoload: true });
  }

  find(query) {
    return new Promise((resolve, reject) => {
      this.service.find(query, (err, docs) => {
        if (err) {
          reject(err);
        }
        resolve(docs);
      })
    })
  }

  findOne(query) {
    return new Promise((resolve, reject) => {
      this.service.findOne(query, (err, docs) => {
        if (err) {
          reject(err);
        }
        resolve(docs);
      })
    })
  }

  insert(doc) {
    return new Promise((resolve, reject) => {
      this.service.insert(doc, (err, newDoc) => {
        if (err) {
          reject(err);
        }
        resolve(newDoc);
      })
    })
  }
};

module.exports = BaseService;
