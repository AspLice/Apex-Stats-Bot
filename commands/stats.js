const { Discord } = require("../ApexStats.js");
const config = require("../config.json");
const percentage = require("percentagebar");
const colours = require("../GameData/legendColors.json");
const axios = require("axios");

var { DateTime } = require("luxon");

module.exports = {
  name: "stats",
  description: "Shows user stats such as kills, damage done, wins, and more.",
  execute(message, args) {
    let platform = args[0];

    if (args[1]) {
      if (args[2]) {
        if (args[3]) {
          var player = `${args[1]}%20${args[2]}%20${args[3]}`;
        } else {
          var player = `${args[1]}%20${args[2]}`;
        }
      } else {
        var player = args[1];
      }
    }

    function addCommas(x) {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    if (!args.length)
      // No args
      return message.channel.send(
        `To use this command, use the following format:\n\`${config.prefix}stats [platform] [username]\``
      );

    if (!platform || !player)
      // Arg 1 or 2 is missing
      return message.channel.send(
        `To use this command, use the following format:\n\`${config.prefix}stats [platform] [username]\``
      );

    if (platform && player) var platformUppercase = platform.toUpperCase();

    var plats = [
      // Current list of supported platforms
      "X1",
      "PS4",
      "PC",
    ];

    if (plats.indexOf(platformUppercase) != -1) {
      var mozam = axios.get(
        `https://api.mozambiquehe.re/bridge?version=4&platform=${platformUppercase}&player=${player}&auth=${config.MozambiqueAPI}`
      );

      function getRexx() {
        if (platformUppercase == "PC") {
          return player;
        } else {
          return "SDCore";
        }
      }

      var rexx = axios.get(
        `https://fn.alphaleagues.com/v1/apex/stats/?username=${getRexx()}&platform=pc&auth=${
          config.ApexAPI
        }`
      );

      message.channel.send("Retrieving stats...").then(async (msg) => {
        axios
          .all([mozam, rexx])
          .then(
            axios.spread((...responses) => {
              const mozam = responses[0].data;
              const rexx = responses[1].data;

              var seasonBP = mozam.global.battlepass.history.season7;
              var season = "7";

              function legendBanner(legend) {
                var legends = [
                  // Current list of legends that have banner images
                  "Bangalore",
                  "Bloodhound",
                  "Caustic",
                  "Crypto",
                  "Gibraltar",
                  "Horizon",
                  "Lifeline",
                  "Loba",
                  "Mirage",
                  "Octane",
                  "Pathfinder",
                  "Rampart",
                  "Revenant",
                  "Wattson",
                  "Wraith",
                  99999999, // Temp new character CData value until it gets updated on the API
                ];

                var tempLegend = 99999999;

                if (legends.indexOf(legend) != -1) {
                  if (legend == tempLegend) {
                    return "NoBanner";
                  } else {
                    return legend;
                  }
                } else {
                  return "NoBanner";
                }
              }

              function avatar() {
                if (mozam.global.avatar != "Not available") {
                  return mozam.global.avatar;
                } else {
                  return "https://sdcore.dev/cdn/ApexStats/Icon.png";
                }
              }

              function accountLevel() {
                if (mozam.global.level >= 500) {
                  return 500;
                } else {
                  return mozam.global.level;
                }
              }

              function bpLevel() {
                if (seasonBP != -1) {
                  if (seasonBP >= 110) {
                    return 110;
                  } else {
                    return seasonBP;
                  }
                } else {
                  return 0;
                }
              }

              function rank(name) {
                if (name == "Silver") {
                  return "<:rankedSilver:787174770424021083>";
                } else if (name == "Gold") {
                  return "<:rankedGold:787174769942462474>";
                } else if (name == "Platinum") {
                  return "<:rankedPlatinum:787174770780667944>";
                } else if (name == "Diamond") {
                  return "<:rankedDiamond:787174769728290816>";
                } else if (name == "Master") {
                  return "<:rankedMaster:787174770680135680>";
                } else if (name == "Predator" || name == "Apex Predator") {
                  // I, for the life of me, cannot find a single person who
                  // is Apex Predator this season. At this point I'm pretty
                  // convinced the API only returns Masters people. Guess we'll
                  // find out when I dig more into it... sometime.
                  return "<:rankedPredator:787174770730336286>";
                } else {
                  return "<:rankedBronze:787174769623302204>";
                }
              }

              function checkBanner(type, legend) {
                var legends = [
                  "Bloodhound",
                  "Gibraltar",
                  "Lifeline",
                  "Loba",
                  "Mirage",
                  "Octane",
                  "Pathfinder",
                  "Rampart",
                  "Revenant",
                ];

                function getType(type) {
                  if (type == "Grand Soiree kills") {
                    return "Kills";
                  } else if (type == "Grand Soiree wins") {
                    return "Wins";
                  } else if (type == "Grand Soiree damage") {
                    return "Damage";
                  }
                }

                if (legends.indexOf(legend) != -1) {
                  return `${getType(type)} as ${legend}`;
                }
              }

              function getFieldTitle(fieldData) {
                if (fieldData != null) {
                  if (
                    fieldData.name == "Grand Soiree kills" ||
                    fieldData.name == "Grand Soiree wins" ||
                    fieldData.name == "Grand Soiree damage"
                  ) {
                    return checkBanner(
                      fieldData.name,
                      mozam.legends.selected.LegendName
                    );
                  } else {
                    return fieldData.name;
                  }
                } else if (fieldData == "undefined") {
                  return "No data";
                } else {
                  return "No data";
                }
              }

              function getFieldValue(fieldData) {
                if (fieldData != null && fieldData != "undefined") {
                  return fieldData.value.toLocaleString("en-US");
                } else if (fieldData == "undefined") {
                  return "-";
                } else {
                  return "-";
                }
              }

              var currentTimestamp = DateTime.local().toFormat("ooo") / 2;

              if (platformUppercase == "PC") {
                // Use Rexx's API to get global account data
                var totalKills = addCommas(rexx.player.stats.kills);
                var totalMatches = addCommas(rexx.player.stats.matches);
                var KPM = rexx.player.stats.kills_per_match;
                var totalWins = addCommas(rexx.player.stats.wins.total);
                var winRatio = addCommas(rexx.player.stats.wins["win%"]);
                var damageDealt = addCommas(rexx.player.stats.damage.dealt);

                const statsEmbed = new Discord.MessageEmbed()
                  .setAuthor(
                    `Apex Legends Stats for ${mozam.global.name} on ${platformUppercase} playing ${mozam.legends.selected.LegendName}`,
                    avatar()
                  )
                  .setColor(colours[mozam.legends.selected.LegendName])
                  .addField(
                    "Ranked Placement",
                    `**Rank:** ${rank(mozam.global.rank.rankName)} ${
                      mozam.global.rank.rankName
                    } ${
                      mozam.global.rank.rankDiv
                    }\n**Score:** ${mozam.global.rank.rankScore.toLocaleString(
                      "en-US"
                    )} `,
                    true
                  )
                  .addField(
                    `Account and Season ${season} BattlePass Level`,
                    `**Account Level ${accountLevel()}/500**\n${percentage(
                      500,
                      accountLevel(),
                      10
                    )}\n**BattlePass Level ${bpLevel()}/110**\n${percentage(
                      110,
                      bpLevel(),
                      10
                    )}`,
                    true
                  )
                  .addField("\u200b", "\u200b")
                  .addField(
                    "Account Kills",
                    `**Total Kills:** ${totalKills}\n**Total Matches:** ${totalMatches}\n**Kills per Match:** ${KPM}`,
                    true
                  )
                  .addField(
                    "Account Wins/Damage",
                    `**Total Wins:** ${totalWins}\n**Win Rate**: ${winRatio}%\n**Damage Dealt:** ${damageDealt}`,
                    true
                  )
                  .addField("Currently Equipped Trackers", "\u200b")
                  .addField(
                    `${getFieldTitle(mozam.legends.selected.data[0])}`,
                    `${getFieldValue(mozam.legends.selected.data[0])}`,
                    true
                  )
                  .addField(
                    `${getFieldTitle(mozam.legends.selected.data[1])}`,
                    `${getFieldValue(mozam.legends.selected.data[1])}`,
                    true
                  )
                  .addField(
                    `${getFieldTitle(mozam.legends.selected.data[2])}`,
                    `${getFieldValue(mozam.legends.selected.data[2])}`,
                    true
                  )
                  .setImage(
                    `https://sdcore.dev/cdn/ApexStats/LegendBanners/${legendBanner(
                      mozam.legends.selected.LegendName
                    )}.png?q=${currentTimestamp}`
                  )
                  .setFooter("Data provided by https://apexlegendsapi.com/");

                msg.delete();
                msg.channel.send(statsEmbed);
              } else {
                // Only show data from main API
                const statsEmbed = new Discord.MessageEmbed()
                  .setAuthor(
                    `Apex Legends Stats for ${mozam.global.name} on ${platformUppercase} playing ${mozam.legends.selected.LegendName}`,
                    avatar()
                  )
                  .setColor(colours[mozam.legends.selected.LegendName])
                  .addField(
                    "Ranked Placement",
                    `**Rank:** ${rank(mozam.global.rank.rankName)} ${
                      mozam.global.rank.rankName
                    } ${
                      mozam.global.rank.rankDiv
                    }\n**Score:** ${mozam.global.rank.rankScore.toLocaleString(
                      "en-US"
                    )} `,
                    true
                  )
                  .addField(
                    `Account and Season ${season} BattlePass Level`,
                    `**Account Level ${accountLevel()}/500**\n${percentage(
                      500,
                      accountLevel(),
                      10
                    )}\n**BattlePass Level ${bpLevel()}/110**\n${percentage(
                      110,
                      bpLevel(),
                      10
                    )}`,
                    true
                  )
                  .addField("Currently Equipped Trackers", "\u200b")
                  .addField(
                    `${getFieldTitle(mozam.legends.selected.data[0])}`,
                    `${getFieldValue(mozam.legends.selected.data[0])}`,
                    true
                  )
                  .addField(
                    `${getFieldTitle(mozam.legends.selected.data[1])}`,
                    `${getFieldValue(mozam.legends.selected.data[1])}`,
                    true
                  )
                  .addField(
                    `${getFieldTitle(mozam.legends.selected.data[2])}`,
                    `${getFieldValue(mozam.legends.selected.data[2])}`,
                    true
                  )
                  .setImage(
                    `https://sdcore.dev/cdn/ApexStats/LegendBanners/${legendBanner(
                      mozam.legends.selected.LegendName
                    )}.png?q=${currentTimestamp}`
                  )
                  .setFooter("Data provided by https://apexlegendsapi.com/");

                msg.delete();
                msg.channel.send(statsEmbed);
              }
            })
          )
          .catch((errors) => {
            console.log(`Error: ${errors}`);
            message.channel.send(
              "That player doesn't exist or we cannot connect to the API. Please try again later."
            );
          });
      });
    } else {
      return message.channel.send(
        "Sorry, it looks like you didn't provide a valid platform.\nFor reference, PC = Origin/Steam, X1 = Xbox, and PS4 = Playstation Network."
      );
    }
  },
};
