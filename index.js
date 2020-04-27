const express = require('express');
const cors = require('cors');
const axios = require('axios');
const parse = require('node-html-parser').parse;
const heroesAPIKey = '10217066373954273'
const app = express();
const PORT = process.env.PORT || 5000

let heroes = [];
let heroesById = {};

// Allows to execute Promises sequentially
const mapSeries = async (iterable, action) => {
  const results = [];
  for (const x of iterable) {
    results.push(await action(x));
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
  try {
    const heroIdList = await fetchHeroIds();
    // we have to get the heroes one after the other, otherwise the API will be overloaded and might not respond well.
    const heroesRaw = await mapSeries(heroIdList, fetchHeroeDetails);
    heroes = heroesRaw.filter(hero => hero !== null)
    heroes.forEach(h => heroesById[h.id] = h);
    console.log('Got all the heroes !')
  } catch (e) {
    console.error(e)
  }
}
fetchAllHeroesDetails();

app.use(cors());
app.get('/heroes', (req, res) => {
  res.json(heroes);
});
app.get('/heroes/:id', (req, res) => {
  const foundHero = heroesById[req.params.id];
  if (foundHero) {
    res.json(foundHero);
  } else {
    res.sendStatus(404);
  }
});
app.listen(PORT, () => console.log(`App listening on port${PORT}`));