const { client } = require("../ApexStats.js");
const config = require("../config.json");
const fetch = require("node-fetch");

// Top.GG API
const DBL = require("dblapi.js");

var { DateTime } = require("luxon");

if (config.topGG == "0") {
  // Don't send data to TopGG
} else {
  const dbl = new DBL(config.topGG, client);
  dbl.on("posted", () => {
    console.log("Server count posted!");
  });
}

client.once("ready", () => {
  console.log(`Logging in as ${client.user.tag}`);

  const botID = client.user.id;

  // Discord Extreme List API
  const DELURL = `https://api.discordextremelist.xyz/v2/bot/${botID}/stats`;

  const DELHeaders = {
    "Content-Type": "application/json",
    Authorization: config.DELToken,
  };

  const DELBody = {
    guildCount: client.guilds.cache.size,
  };

  if (config.DELToken == "0") {
    // Don't send data to DEL
  } else {
    fetch(DELURL, {
      method: "POST",
      headers: DELHeaders,
      body: JSON.stringify(DELBody),
    })
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        console.log(json);
      });
  }

  // Discord Bot List API
  const DBLURL = `https://discordbotlist.com/api/v1/bots/${botID}/stats`;

  const DBLHeaders = {
    "Content-Type": "application/json",
    Authorization: config.DBLToken,
  };

  const DBLBody = {
    guilds: client.guilds.cache.size,
  };

  if (config.DBLToken == "0") {
    // Don't send data to DEL
  } else {
    fetch(DBLURL, {
      method: "POST",
      headers: DBLHeaders,
      body: JSON.stringify(DBLBody),
    })
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        console.log(json);
      });
  }

  function setPresence() {
    client.user
      .setPresence({
        activity: {
          name: `${config.prefix}commands | Providing stats for ${client.guilds.cache.size} servers`,
          type: "WATCHING",
        },
        status: "online",
      })
      .catch(console.error);
  }

  // Set intitial bot presence on load, otherwise presence
  // will be empty until the next update
  setPresence();
  console.log(
    `[${DateTime.local().toFormat("hh:mm:ss")}] Updated presence for ${
      client.user.tag
    }`
  );

  // Update the bot presence every 30 minutes to update
  // the amount of servers the bot is in
  setInterval(function () {
    setPresence();
    console.log(
      `[${DateTime.local().toFormat("hh:mm:ss")}] Updated presence for ${
        client.user.tag
      }`
    );
  }, Math.max(1, 30 || 1) * 60 * 1000);
});
