const request = require('request-promise');

class Apartments {
  constructor() {
  }

  get baseUrl() {
    return 'https://ak.api.onliner.by/search/apartments?rent_type%5B%5D=1_room&price%5Bmin%5D=50&price%5Bmax%5D=300&currency=usd&only_owner=true&metro%5B%5D=blue_line&bounds%5Blb%5D%5Blat%5D=53.74952285419751&bounds%5Blb%5D%5Blong%5D=27.392889708280567&bounds%5Brt%5D%5Blat%5D=54.0202761500645&bounds%5Brt%5D%5Blong%5D=27.667891234159473&page=1&_=0.9545'
  }

  async getApartments () {
    const apartments = await this._callApi();
    return apartments.apartments;
  }

  async _callApi(data, params) {
    const url = this.baseUrl;

    const requestOptions = {
      uri: url,
      method: 'GET',
      json: true,
    };

    const response = await request(requestOptions);

    return response;
  }

};

module.exports = new Apartments();