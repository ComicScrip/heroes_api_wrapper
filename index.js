const express = require('express');
const cors = require('cors');
const axios = require('axios');
const parse = require('node-html-parser').parse;
const heroesAPIKey = '10217066373954273'
const app = express();
const url = require('url');
const PORT = process.env.PORT || 5000

let heroes = [];
let heroesById = {};

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
  heroes = [];
  heroesById = {};

  try {
    const heroIdList = await fetchHeroIds();
    // we have to get the heroes one after the other, otherwise the API will be overloaded and might not respond well.
    await executeSequentiallyWith(heroIdList, fetchHeroeDetails, h => {
      if (h) {
        heroes.push(h);
        heroesById[h.id] = h
      }
    });
    console.log('Got all the heroes !')
  } catch (e) {
    console.error(e)
  }
}
fetchAllHeroesDetails();

app.use(cors());
app.get('/', (req, res) => res.redirect('/heroes'));
app.get('/heroes', (req, res) => {
  let jsonData = {};
  const queryParams = url.parse(req.url, true).query;
  const heroIds = queryParams.heroIds;
  const limit = parseInt(queryParams.limit) || heroes.length;
  const offset = parseInt(queryParams.offset) || 0;
  
  if (heroIds) {
    jsonData = heroIds.split(',').map(id => heroesById[id]).filter(h => !!h);
  } else {
    jsonData = heroes;
  }

  if (!isNaN(limit) && !isNaN(offset)) {
    jsonData = jsonData.slice(offset, limit);
  }

  res.json(jsonData);
});
app.get('/heroes/:id', (req, res) => {
  const foundHero = heroesById[req.params.id];
  if (foundHero) {
    res.json(foundHero);
  } else {
    res.sendStatus(404);
  }
});
app.listen(PORT, () => console.log(`App listening on port ${PORT}`));