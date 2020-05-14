const fs = require('fs');
const axios = require('axios');
const parse = require('node-html-parser').parse;
const heroesAPIKey = '10217066373954273'

const writeToJSONFile = (filename, data) => new Promise((resolve, reject) => {
  fs.writeFile(filename, JSON.stringify(data), (err) => {
    if (err) reject(err);
    else resolve()
  });
})

// Allows to execute Promises sequentially
const executeSequentiallyWith = async (iterable, action, onResult) => {
  const results = [];
  for (const x of iterable) {
    const result = await action(x);
    if (onResult) onResult(result);
    results.push(result);
  }
  return results;
}

// Gets all the heroes identifiers (yes, that's very "hacky")
const fetchHeroIds = () => {
  return axios.get('https://superheroapi.com/ids.html').then(response => {
    return parse(response.data)
      .querySelectorAll('table tbody tr')
      .map(tr => tr.querySelector('td').innerHTML)
  })
};

// Fetch details for one hero
const fetchHeroeDetails = async (heroId) => {
  console.log('getting details for hero #' + heroId);
  return axios.get(`https://superheroapi.com/api/${heroesAPIKey}/${heroId}`)
    .then(response => {
      console.log('got response for hero #' + heroId)
      return (response.data && response.data.id) ? response.data : null
    })
    .catch(error => { console.error(error); return null });
}

const fetchAllHeroesDetails = async () => {
  let heroes = [];

  try {
    const heroIdList = await fetchHeroIds();
    // we have to get the heroes one after the other, otherwise the API will be overloaded and might not respond well.
    await executeSequentiallyWith(heroIdList, fetchHeroeDetails, h => {
      if (h) {
        heroes.push(h);
      }
    });
    console.log('Got all the heroes !')    
  } catch (e) {
    console.error(e)
  }
  
  return heroes
}

fetchAllHeroesDetails()
.then(heroes => writeToJSONFile('heroes.json', heroes))
.then(() => {
  console.log('All heroes written to heroes.json');
});