const fs = require('fs');
const express = require('express');
const cors = require('cors');
const app = express();
const url = require('url');
const PORT = process.env.PORT || 5000

const run = async () => {
  try {
    const heroesJSON = await new Promise((resolve, reject) => fs.readFile('heroes.json', (err, data) => {
      if (err) reject(err);
      else resolve(data)
    }));
    const heroes = JSON.parse(heroesJSON) || [];
    const heroesById = {}
    heroes.forEach(h => heroesById[h.id] = h);
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
  } catch (e) {
    console.error(e)
    console.error('An error has occured while loading heroes from "heroes.json", maybe you need to re-run "node scraper.js" ?')
  }
}

run();

