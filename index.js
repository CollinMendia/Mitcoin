/**
 * MITCOIN BOT
 * Made by Mitrue and PotatOS
 * A Discord bot that simulates a cryptocurrency
 * Users can invest, sell, and give MTC as the value changes in order to increase their overall balance
 * Mitcoin value, all user balances, all users in the blacklist, and a history of past values are stored in a database automatically
 * Blacklisted users are not allowed to participate in the Mitcoin economy, but can still use commands to view information
 * 
 * COMMANDS - Everyone can use
 * balance     - Check your balance in Mitcoin
 * change      - View how much Mitcoin's value has changed over time
 * complain    - Send a formal complaint to the Mitcoin executives
 * give        - Give a user an amount of Mitcoin
 * graph       - Display a graph of recent Mitcoin values
 * help        - Show a list of commands
 * invest      - Invest in a certain amount of Mitcoin
 * invite      - Join Mitcoin's server or invite the bot
 * leaderboard - View the current Mitcoin leaderboard
 * logo        - See the Mitcoin logo
 * sell        - Sell Mitcoin in return for money
 * uptime      - See how long the bot has been running
 * value       - See Mitcoin's current value
 * 
 * COMMANDS - Executives only
 * blacklist - View, add to, or remove from the blacklist
 * giveaway  - Hold a Mitcoin giveaway where a random user is given an amount of MTC at the end
 * revive    - Revive a past giveaway if it didn't automatically end
 * 
 * Don't Delay. Invest Today!
 * 
 * TO DO
 * Add DM commands
 * Add features for the Mitcoin server
 */


// Bot setup
const botconfig = require("./botconfig.json");
const Discord = require("discord.js");
const fs = require("fs");
const ms = require("ms");
const bot = new Discord.Client({disableEveryone: true});

// Some other specific things to set up
let maintenance = true; // Whether the bot is in maintenance mode
const executives = ["286664522083729409", "365444992132448258"]; // Mitcoin executives PotatOS and Mitrue
const blockchain = "481797287064895489"; // Blockchain channel ID
const logs = "485839182170685460"; // Logs channel ID
const MTC = "<:MTC:518256956214083586>"; // Mitcoin logo emoji
let fluctuationTime = ms("5m"); // How long it takes for Mitcoin's value to automatically fluctuate
let maxHistory = 1000; // Maximum number of history values to be saved

// For creating graphs
const ChartjsNode = require("chartjs-node");

// Connect to the database
const { Client } = require("pg");

const client = new Client({
  connectionString: `${botconfig.connectionURL || process.env.DATABASE_URL}`,
  ssl: true
})
client.connect();

// Set up Mitcoin information
let mitcoinInfo = {
  value: 1,
  demand: 0,
  balances: {},
  blacklist: [],
  history: []
};

// Load Mitcoin information from the database
/*client.query("SELECT * FROM mitcoin", (err, res) => {
  let infoString = "";
  res.rows.forEach(r => {
    infoString += r.info;
  });

  mitcoinInfo = JSON.parse(infoString);
});*/
client.query("CREATE TABLE mitcoin (index INTEGER, info TEXT)");
client.query(`INSERT INTO mitcoin VALUES(0, '{"value":1.0660067265004738,"demand":-5.708151780573352,"balances":{"449348071957069856":{"balance":0,"money":5.82083},"328641116884959235":{"balance":1.0101,"money":0},"343534823228571659":{"balance":1000,"money":32712.6},"474703610538885122":{"balance":0,"money":22.1322},"320654624556056586":{"balance":1002.01,"money":327.328},"286664522083729409":{"balance":246649000,"money":0},"428325571861413889":{"balance":1.05219,"money":0},"325070981158928393":{"balance":0.99,"money":1478.76},"230450518915416067":{"balance":1.53408,"money":0},"150463430430687233":{"balance":100.011,"money":74.5776},"345282003328958464":{"balance":2000,"money":0},"270997352939126794":{"balance":1.7061,"money":0},"295995265037631500":{"balance":44666500,"money":0},"365444992132448258":{"balance":1949250,"money":0},"408092142557462538":{"balance":0,"money":1886.8652286109},"198942810571931649":{"balance":1.80688,"money":0},"188350841600606209":{"balance":1.12415,"money":0},"358316213870395392":{"balance":25,"money":2881.23},"402882532171055112":{"balance":1.03057,"money":0},"316719380811612162":{"balance":51.29,"money":3.93422},"429686318528856074":{"balance":0,"money":1.23611},"407674114384461835":{"balance":0,"money":554510.5245871088},"402518087653392447":{"balance":0,"money":1.25986},"309845156696424458":{"balance":1147860,"money":0},"323988643603677185":{"balance":30.9637,"money":0},"214366501686214656":{"balance":0,"money":2.36473},"499012550487441408":{"balance":0,"money":1007.73},"474591598114504724":{"balance":0,"money":158.08},"375738267682734081":{"balance":29720800,"money":0},"410561489834082306":{"balance":3576.82,"money":1},"350735012523671552":{"balance":1.72585,"money":0},"212011192820957184":{"balance":0,"money":35017400},"325069847736221708":{"balance":10.6983,"money":0},"485555706804830208":{"balance":0,"money":2.33628},"481842036639531008":{"balance":2792.0337279070673,"money":1999.9999999999995},"416802709484732417":{"balance":1574.7637471807777,"money":0},"221285118608801802":{"balance":69.63,"money":1},"298636036135714816":{"balance":5.03495,"money":0},"406567735812947970":{"balance":0,"money":2.76989},"519173093239947264":{"balance":1130.68,"money":0},"374929883698036736":{"balance":0,"money":12617308.062390551},"167711491078750208":{"balance":1182.56,"money":3896700},"428285467549630487":{"balance":0,"money":2230677.2707519075},"477533272650547224":{"balance":3.05531,"money":0},"218397146049806337":{"balance":2094.86,"money":0},"226887818364846082":{"balance":152841,"money":0},"486222324165771266":{"balance":29,"money":0},"499817470442602496":{"balance":23607,"money":0},"376513305830752256":{"balance":1683.94,"money":0},"419151003766620180":{"balance":14856.4,"money":0},"434540925725966336":{"balance":1802460,"money":0},"499882708860665856":{"balance":0,"money":33859.63307983703},"530157563065663498":{"balance":0,"money":29063.592483616118},"439076109678805004":{"balance":20617.6,"money":1591.96},"198590928166977537":{"balance":0,"money":207.038},"370381633305575426":{"balance":2.3703,"money":0},"228299593417228288":{"balance":2.3703,"money":0},"368430274587000852":{"balance":291.66199029126216,"money":0},"469544491989336064":{"balance":0,"money":56.23647071717107},"534954063129870362":{"balance":0,"money":4553.520197815838},"236960229370232835":{"balance":1101.61,"money":0},"302676377230901250":{"balance":0,"money":5.58428},"403717771650924546":{"balance":1.20713,"money":0},"331694609681874945":{"balance":134.98,"money":14.2792},"314108469256912897":{"balance":0.964838,"money":0},"515562864241541125":{"balance":1.08716,"money":0},"347183071449186308":{"balance":50,"money":1},"367145946985005057":{"balance":0,"money":217.672},"268131125279457280":{"balance":789.1277147204593,"money":1386.9099999999999},"385488500440694784":{"balance":0.938954,"money":0.199738},"456220387148169236":{"balance":6001.42,"money":0},"473496535599022080":{"balance":0,"money":1}},"blacklist":[],"history":[0.888,0.862,0.862,0.896,0.887,0.861,0.826,0.859,1.765,1.853,1.816,1.762,1.815,1.778,1.814,1.85,1.795,1.813,1.813,1.867,1.792,1.81,1.828,1.81,1.846,1.92,1.882,1.938,1.919,2.015,1.974,2.053,2.053,2.115,2.094,2.177,2.265,2.174,2.131,2.237,2.215,2.325,2.325,2.256,2.165,2.165,2.1,2.016,1.956,1.995,1.975,1.916,2.012,1.992,1.992,1.932,1.99,1.91,1.91,1.91,1.891,1.91,1.834,1.907,1.812,1.83,1.903,1.979,1.92,1.92,1.92,1.843,1.935,1.974,2.072,2.072,1.969,1.91,1.91,1.833,1.852,1.833,1.815,1.869,1.925,1.906,1.982,2.062,2.062,2,1.98,1.98,1.96,1.96,1.921,1.844,1.825,1.898,1.974,1.955,1.955,1.994,2.074,2.074,2.094,2.031,2.133,2.154,2.133,2.133,2.047,2.15,2.042,2.042,2.104,2.167,2.232,2.142,2.1,2.163,2.206,2.14,2.225,2.314,2.384,2.288,2.311,2.404,2.404,2.404,2.308,2.4,2.28,2.28,2.303,2.234,2.256,2.233,2.3,2.231,2.12,2.099,2.12,2.162,2.097,2.139,2.096,2.138,2.181,2.181,2.225,2.136,2.157,2.243,2.288,2.311,2.195,2.108,2.108,2.002,1.922,1.941,1.941,1.844,1.771,1.717,1.735,1.665,1.632,1.681,1.698,1.664,1.73,1.661,1.694,1.711,1.643,1.692,1.658,1.675,1.692,1.624,1.543,1.543,1.496,1.481,1.481,1.541,1.541,1.494,1.539,1.493,1.448,1.448,1.463,1.434,1.362,1.389,1.417,1.389,1.305,1.344,1.291,1.291,1.278,1.239,1.289,1.315,1.275,1.199,1.235,1.247,1.197,1.233,1.171,1.101,1.145,1.088,1.055,1.055,1.024,1.034,1.003,0.963,0.963,0.944,0.934,0.934,0.906,0.942,0.905,0.932,0.95,0.922,0.885,0.92,0.874,0.857,0.848,0.874,0.883,0.838,0.813,0.838,0.829,0.804,0.764,0.734,0.697,0.676,0.649,0.642,0.636,0.655,0.629,0.629,0.648,0.654,0.641,0.641,0.616,0.634,0.64,0.66,0.673,0.646,0.678,0.671,0.638,0.663,0.663,0.69,0.655,0.655,0.668,0.648,0.622,0.654,0.68,0.687,0.721,0.685,0.705,0.741,0.778,0.809,0.801,0.825,0.841,0.875,0.849,0.84,0.857,0.84,0.873,0.891,0.935,0.945,0.926,0.907,0.916,0.944,0.925,0.925,0.897,0.933,0.905,0.95,0.95,0.941,0.95,0.979,1.018,1.048,1.017,1.027,1.048,1.09,1.133,1.145,1.145,1.11,1.155,1.132,1.109,1.065,1.065,1.075,1.075,1.032,1.012,1.032,1.011,0.971,1,1.05,1.008,1.008,0.988,1.037,1.089,1.045,1.056,1.109,1.109,1.153,1.153,1.095,1.128,1.094,1.149,1.103,1.114,1.159,1.135,1.17,1.158,1.112,1.1,1.056,1.088,1.142,1.165,1.177,1.13,1.164,1.141,1.141,1.118,1.095,1.041,1.02,1.02,1.01,1.01,0.989,0.999,0.979,1.018,1.069,1.027,1.057,1.036,0.995,0.985,1.024,1.075,1.032,1.053,1.095,1.095,1.139,1.196,1.148,1.171,1.218,1.169,1.169,1.204,1.228,1.179,1.203,1.155,1.143,1.155,1.201,1.189,1.201,1.165,1.118,1.129,1.163,1.128,1.162,1.197,1.233,1.27,1.257,1.207,1.147,1.204,1.216,1.228,1.203,1.216,1.179,1.191,1.143,1.166,1.201,1.225,1.286,1.273,1.337,1.284,1.335,1.402,1.346,1.4,1.386,1.441,1.398,1.342,1.288,1.34,1.299,1.364,1.378,1.447,1.447,1.461,1.418,1.418,1.375,1.416,1.346,1.292,1.318,1.344,1.344,1.33,1.317,1.304,1.291,1.33,1.37,1.356,1.383,1.341,1.368,1.368,1.382,1.437,1.423,1.466,1.495,1.54,1.478,1.463,1.537,1.567,1.567,1.536,1.597,1.629,1.58,1.517,1.457,1.486,1.53,1.607,1.559,1.527,1.527,1.512,1.452,1.423,1.423,1.38,1.352,1.379,1.324,1.377,1.446,1.403,1.375,1.388,1.388,1.347,1.333,1.387,1.373,1.331,1.292,1.227,1.19,1.214,1.19,1.178,1.213,1.262,1.211,1.248,1.26,1.298,1.272,1.259,1.259,1.309,1.323,1.27,1.232,1.207,1.147,1.192,1.192,1.157,1.11,1.066,1.066]}')`);

function updateDatabase(info, table) {
  if (maintenance) return;
  
  let infoString = JSON.stringify(info);

  client.query(`DELETE FROM ${table}`);

  let substrIncrement = 65535;
  for (let i = 0; i < infoString.length; i += substrIncrement) {
    client.query(`INSERT INTO ${table} VALUES(${i / substrIncrement}, ${infoString.substr(i, substrIncrement)})`);
  }
};

// Automatically fluctuate Mitcoin's value and update automatic things
setInterval(function() {
  // Calculate the random fluctuation
  // Without demand: mitcoinInfo.value *= (round(random(10) - 5 + (1 - value) / 5) + 100) / 100
  let fluctuation = Math.round(Math.random() * 10 - 4.96 + mitcoinInfo.demand / 16);

  // Demand decays slightly over time
  mitcoinInfo.demand *= 0.9997;
  
  // Change Mitcoin's value
  mitcoinInfo.value *= (fluctuation + 100) / 100;
  mitcoinInfo.history.push(parseFloat(mitcoinInfo.value.toFixed(3)));
  mitcoinInfo.history.splice(0, mitcoinInfo.history.length - maxHistory - 1);
  
  if (!maintenance) {
    bot.user.setActivity(`MTC Value: ${mitcoinInfo.value.toFixed(3)} | m/help`);

    // Save new value to the database
    updateDatabase(mitcoinInfo, "mitcoin");
  }
  else bot.user.setActivity("Maintenance");

  // Update Mitcoin server roles
  let leaderboard = Object.values(mitcoinInfo.balances).sort((a, b) => b.balance - a.balance);
  let ids = [];
  for (let i = 0; i < Math.min(leaderboard.length, 5); i++) {
    bot.users.forEach(u => {
      if (mitcoinInfo.balances[u.id] && mitcoinInfo.balances[u.id] === leaderboard[i]) ids.push(u.id);
    })
    if (mitcoinInfo.balances[ids[ids.length - 1]] !== leaderboard[i]) {
      leaderboard.splice(i, 1);
      i--;
    }
  }
  
  bot.guilds.get("424284908991676418").members.forEach(m => {
    // Richest of the Rich
    if (m.roles.has("527225117818880000") && mitcoinInfo.balances[m.user.id] !== mitcoinInfo.balances[ids[0]]) m.removeRole("527225117818880000");
    else if (!m.roles.has("527225117818880000") && mitcoinInfo.balances[m.user.id] === mitcoinInfo.balances[ids[0]] && ids[0]) m.addRole("527225117818880000");

    // Leaderboard Member
    if (m.roles.has("527225117818880000") || (m.roles.has("530794529612365863") && !ids.includes(m.user.id))) m.removeRole("530794529612365863");
    else if (!m.roles.has("527225117818880000") && !m.roles.has("530794529612365863") && ids.includes(m.user.id)) m.addRole("530794529612365863");

    // Mitcoin Millionaire
    if (m.roles.has("530794639301673000") && mitcoinInfo.balances[m.user.id] && mitcoinInfo.balances[m.user.id].balance < 1000000) m.removeRole("530794639301673000");
    else if (!m.roles.has("530794639301673000") && mitcoinInfo.balances[m.user.id] && mitcoinInfo.balances[m.user.id].balance >= 1000000) m.addRole("530794639301673000");
  })
}, fluctuationTime);

// When the bot is loaded
bot.on("ready", async () => {
  if (Object.keys(mitcoinInfo.balances).length <= 0 && bot.user.id === "430468476038152194") {
    console.log("Database not loaded properly?");
    bot.users.get(executives[0]).send("Database not loaded properly?").then(setTimeout(function() {process.exit(0);}, 0));
  }

  console.log(`${bot.user.username} is online in ${bot.guilds.size} servers!`);
  if (maintenance) bot.user.setActivity("Maintenance");
  else bot.user.setActivity(`MTC Value: ${mitcoinInfo.value.toFixed(3)} | m/help`);

  // Log a backup of all Mitcoin info
  console.log(JSON.stringify(mitcoinInfo));
});

// Send an alert when the bot joins a new server
bot.on("guildCreate", guild => {
  let logChannel = bot.channels.get(logs);
  console.log(`NEW SERVER JOINED: ${guild.name}`)

  let joinEmbed = new Discord.RichEmbed()
  .setColor("#23dc23")
  .setThumbnail(guild.iconURL)
  .setTitle("New server joined")
  .setDescription(guild.name)
  .addField("Server owner", `${guild.owner.user.username}#${guild.owner.user.discriminator}\nID: ${guild.ownerID}`)
  .addField("Created at", guild.createdAt)
  .addField("Members", guild.memberCount)
  .addField("Invites", "None")
  .setFooter(`Server ID: ${guild.id}`)
  .setTimestamp(guild.joinedAt);
  logChannel.send(joinEmbed);

  setTimeout(function() {
    // Attempt to get invites to the server
    /*try {
      guild.fetchInvites().then(invites => invites.forEach(i => {
        if (joinEmbed.fields[3].value === "None") joinEmbed.fields[3].value = "";
        joinEmbed.fields[3].value += `[${i.code}](https://discord.gg/${i.code} '${`${i.inviter.username}#${i.inviter.discriminator}`}')\n`;
        if (i === invites.last()) logChannel.send(joinEmbed);
      }))
    } catch(e) {*/
      try {
        guild.channels.first().createInvite({maxAge: 0}).then(i => {
          joinEmbed.fields[3].value = `[${i.code}](https://discord.gg/${i.code} '${i.inviter.username}#${i.inviter.discriminator} | #${i.channel.name}')`;
        })
      } catch(e) {}
      setTimeout(function() {logChannel.send(joinEmbed)}, 4000);
    //}
  }, 1000);
});

bot.on("guildDelete", guild => {
  let leaveEmbed = new Discord.RichEmbed()
  .setColor("#dc2323")
  .setThumbnail(guild.iconURL)
  .setTitle(`Server ${guild.memberCount > 0 ? "left" : "deleted"}`)
  .setDescription(guild.name)
  .addField("Server owner", `${guild.owner.user.username}#${guild.owner.user.discriminator}\nID: ${guild.ownerID}`)
  .addField("Created at", guild.createdAt)
  .setFooter(`Server ID: ${guild.id}`)
  if (guild.memberCount > 0) leaveEmbed.addField("Members", guild.memberCount)

  bot.channels.get(logs).send(leaveEmbed);
});

// For the Mitcoin server
bot.on("guildMemberAdd", member => {
  if (member.guild.id === "424284908991676418") {
    // Automatically give the user the Order of Mitcoin role
    member.addRole("518863961618251776");

    // Send some information about the user
    let joinEmbed = new Discord.RichEmbed()
    .setColor("ff9900")
    .setAuthor(`${member.user.username}#${member.user.discriminator}`, member.user.displayAvatarURL)
    .setTitle("New member joined")
    .setDescription(`${member}`)
    .addField("Account created", member.user.createdAt)
    .addField("Balance", `${(mitcoinInfo.balances[member.user.id] || {balance: 0}).balance} ${MTC}`, true)
    .addField("Money", `${(mitcoinInfo.balances[member.user.id] || {money: 1}).money} :dollar:`, true)
    .setFooter(`ID: ${member.user.id}`)
    .setTimestamp(member.joinedAt)

    bot.channels.get(logs).send(joinEmbed);
  }
})

bot.on("guildMemberRemove", member => {
  if (member.guild.id === "424284908991676418") {
    let leaveEmbed = new Discord.RichEmbed()
    .setColor("ff9900")
    .setAuthor(`${member.user.username}#${member.user.discriminator}`, member.user.displayAvatarURL)
    .setTitle("Member left")
    .setDescription(`${member}`)
    .setFooter(`ID: ${member.user.id}`)
    .addField("Joined at", member.joinedAt)

    bot.channels.get(logs).send(leaveEmbed);
  }
})

// All bot commands
const commands = {
  balance: {
    name: "balance",
    alias: ["bal"],
    desc: "Check your balance in Mitcoin",
    run: (message, args) => {
      // Whose balance is being shown
      let balUser = message.author;
      if (executives.includes(message.author.id)) {
        balUser = message.mentions.members.first() || bot.users.get(args[0] || message.author.id) || message.author;
      }
      balUser = balUser.user || balUser;
      if (balUser.bot) balUser = message.author;

      // If the user doesn't have a Mitcoin balance yet, set it up
      if (!mitcoinInfo.balances[balUser.id]) mitcoinInfo.balances[balUser.id] = {
        balance: 0,
        money: 1
      }

      // The user's Mitcoin balance
      let MTCBal = mitcoinInfo.balances[balUser.id].balance;
  
      // Embed to show the user's balance information
      let balEmbed = new Discord.RichEmbed()
      .setColor("ff9900")
      .setAuthor(balUser.username, balUser.displayAvatarURL)
      .setThumbnail("https://cdn.discordapp.com/attachments/495366302542594058/504035403620155423/iur.png")
      .addField("Mitcoin", `${MTCBal.toFixed(3)} ${MTC}`, true)
      .addField("Equivalent value", `${(mitcoinInfo.value * MTCBal).toFixed(3)} :dollar:`, true)
      .addField("Money", `${mitcoinInfo.balances[balUser.id].money.toFixed(3)} :dollar:`, true)
      .addField("Equivalent value", `${(mitcoinInfo.balances[balUser.id].money / mitcoinInfo.value).toFixed(3)} ${MTC}`, true)
      //if (investmentFunds.users[balUser.id]) balEmbed.addField("Investment fund", `${investmentFunds.users[balUser.id].amount} ${MTC}`)
      if (mitcoinInfo.blacklist.includes(balUser.id)) balEmbed.setFooter("You are blacklisted from using Mitcoin")
  
      message.channel.send(balEmbed);
    }
  },
  blacklist: {
    name: "blacklist",
    run: (message, args) => {
      // Executive-only command
      if (!executives.includes(message.author.id)) return;
      
      // DM the list of blacklisted users
      if (!args[0]) return message.author.send(`**List of blacklisted users:**\n${mitcoinInfo.blacklist.length > 0 ? `<@${mitcoinInfo.blacklist.join(">\n<@")}>` : "None"}`);

      let blacklistUser = bot.users.get(args[0]) || bot.users.find(u => u.username === args.join(" ")) || message.mentions.members.first();
      if (!blacklistUser) return message.channel.send(`${args.join(" ")} is not a valid user`);
      blacklistUser = blacklistUser.user || blacklistUser;

      // If the user is already blacklisted, remove them
      if (mitcoinInfo.blacklist.includes(blacklistUser.id)) {
        message.channel.send(`User: \`${blacklistUser.username}#${blacklistUser.discriminator}\` successfully removed from blacklist`);
        return mitcoinInfo.blacklist.splice(mitcoinInfo.blacklist.indexOf(blacklistUser.id), 1)
      }

      // Otherwise, blacklist them
      message.channel.send(`User: \`${blacklistUser.username}#${blacklistUser.discriminator}\` successfully added to blacklist`);
      mitcoinInfo.blacklist.push(blacklistUser.id);
    }
  },
  change: {
    name: "change",
    desc: "View how much Mitcoin's value has changed over time",
    run: (message, args) => {
      // If there is no valid time specified
      if (!args[0]) return message.channel.send("Specify a number of fluctuations");
      let time = args.join("");
      if (time.toLowerCase() === "all") time = mitcoinInfo.history.length - 1;
      if (time < 1 || !parseInt(time)) return message.channel.send("Specify a valid number of fluctuations");

      // Calculate the actual time
      if (time > mitcoinInfo.history.length - 1) time = mitcoinInfo.history.length - 1;
      time = Math.floor(time) * fluctuationTime;
      
      // Format the time
      let timeString = "";
      if (time >= 86400000) timeString += `${Math.floor(time / 86400000)} day${time > 172800000 ? "s" : ""}, `;
      if (time >= 3600000) timeString += `${Math.floor((time % 86400000) / 3600000)} hour${time % 86400000 > 7200000 ? "s" : ""}, `;
      if (time >= 60000) timeString += `${Math.floor((time % 3600000) / 60000)} minutes`;

      // Embed to show the percent change in value
      let changeEmbed = new Discord.RichEmbed()
      .setColor("#ff9900")
      .setTitle(`Mitcoin change over the past ${timeString}`)
      .addField(`${time / fluctuationTime} fluctuations`, `${Math.round(mitcoinInfo.value / mitcoinInfo.history[mitcoinInfo.history.length - time / fluctuationTime - 1] * 100)}%`)

      message.channel.send(changeEmbed);
    }
  },
  /*complain: {
    name: "complain",
    desc: "Send a formal complaint to the Mitcoin executives",
    run: (message, args) => {
      let complaint = args.join(" ");
      if (!complaint) return message.channel.send("Specify a message");
      // Log channel to send the complain in
      let complaintChannel = bot.channels.get(logs);
      // Send the complaint in an embed
      let complaintEmbed = new Discord.RichEmbed()
      .setColor("#ff9900")
      .setAuthor(message.author.username, message.author.displayAvatarURL)
      .addField("New complaint", complaint)
      .setTimestamp(message.createdAt);
      // Confirm that the complain was sent successfully
      message.channel.send("✅ Your complaint has been sent and will be viewed shortly");
      complaintChannel.send(complaintEmbed);
    }
  },*/
  give: {
    name: "give",
    desc: "Give a user an amount of Mitcoin",
    run: (message, args) => {
      // If the user is blacklisted
      if (mitcoinInfo.blacklist.includes(message.author.id)) return message.reply("you are blacklisted from using Mitcoin");

      // If the user doesn't have any Mitcoin to pay
      if (mitcoinInfo.balances[message.author.id].balance === 0) return message.reply("you don't have any Mitcoin!");

      // If no user is specified to pay to
      if (!args[0]) return message.channel.send("Specify a user to pay");
  
      // First user that is mentioned
      let payUser = bot.users.get(args[0]) || message.mentions.members.first();
      if (!payUser) return message.channel.send("Specify a valid user");
      payUser = payUser.user || payUser;
      
      if (mitcoinInfo.blacklist.includes(payUser.id)) return message.channel.send("That user is blacklisted");
      if (payUser.bot) return message.channel.send("Specify a valid user");
      if (payUser === message.author) return message.channel.send("You can't pay yourself!");
      
      // If no amount is specified
      if (!args[1]) return message.channel.send("Specify an amount to pay");
      if (args[0] !== `<@${payUser.id}>` && args[0] !== `<@!${payUser.id}>` && args[0] !== payUser.id) return message.channel.send("Specify the member, then the number");
  
      let payAmount = parseFloat(args[1]).toFixed(3);
      if (args[1].toLowerCase() === "all") payAmount = mitcoinInfo.balances[message.author.id].balance;
  
      if (!payAmount || payAmount === "NaN" || payAmount <= 0) return message.channel.send(`Specify a valid number to pay`);
      
      // If the user has less Mitcoin than they say to pay
      if (mitcoinInfo.balances[message.author.id].balance < payAmount) return message.reply("you don't have enough Mitcoin to pay!");
  
      // If the user doesn't have a Mitcoin balance yet, set it up
      if (!mitcoinInfo.balances[payUser.id]) mitcoinInfo.balances[payUser.id] = {
          balance: 0,
          money: 1
      };
  
      // Actually calculate the payment
      mitcoinInfo.balances[message.author.id].balance -= payAmount;
      mitcoinInfo.balances[payUser.id].balance += parseFloat(payAmount);
  
      // Send the confirmation message
      message.channel.send(`${message.author} has given ${payAmount} ${MTC} to ${payUser.username}#${payUser.discriminator}`);

      // Send it in the blockchain
      let embed = new Discord.RichEmbed()
      .setColor("#ff9900")
      .setAuthor(`${message.author.username}#${message.author.discriminator}`, message.author.displayAvatarURL)
      .addField("Given", `${payAmount} ${MTC}`)
      .addField("Equivalent Amount", `${payAmount * mitcoinInfo.value} :dollar:`)
      .addField("Recipient", `<@${payUser.id}>`)
      .setTimestamp(message.createdAt);

      bot.channels.get(blockchain).send(embed);
    }
  },
  giveaway: {
    name: "giveaway",
    run: async (message, args) => {
      // Executive-only command
      if (!executives.includes(message.author.id)) return;

      // How long the giveaway will last
      if (!args[0]) return message.channel.send("Specify a time");
      time = args[0];
      if (!ms(time) || time <= 0 || ms(time) <= 0) return message.channel.send("Specify a valid time");

      if (time / time === 1) time = ms(time);

      // How much Mitcoin will be given
      if (!args[1]) return message.channel.send("Specify a range of values");
      let min = parseFloat(args[1]);
      let max = parseFloat(args[2]) || min;
      if ((!min && min !== 0) || !max) return message.channel.send("Specify a valid range");
      
      // Amount can be randomly chosen
      let winAmount = Math.random().toFixed(2) * (max - min) + min;

      // Embed for users to react to
      let giveEmbed = new Discord.RichEmbed()
      .setColor("#ff9900")
      .setTitle(`New ${MTC} Giveaway!`)
      .addField(`How much MTC is available?`, winAmount)
      .addField("To enter the giveaway", `React to this message with the ${MTC} emoji`)
      .setTimestamp(message.createdAt)
      .setFooter(`This giveaway will end in ${time}`)
      
      // React using the MTC emoji
      await message.delete().catch();
      message.channel.send(giveEmbed).then(msg => {
        msg.react(MTC.split(/:|>/)[2]);

        // After the giveaway has ended
        setTimeout(function() {
          msg.delete();

          // Determine who reacted to the message
          let entries = msg.reactions.get(MTC.split(/<:|>/)[1]);
          
          // If no one reacted
          if (!entries || entries.count <= 1) return message.channel.send("**No one reacted to the giveaway!**\n__Make sure to react before the time runs out.__");
          console.log(entries)
          // Choose a random winner
          let winner = Math.floor(Math.random() * (entries.count - 1));

          // Find which user was the random winner
          let winUser = 0;
          entries.users.forEach(r => {
            if (!r.bot && winner <= 0 && winUser === 0) winUser = r;
            winner--;
          }).then(e => {
            // If the winner doesn't have a Mitcoin balance yet, set it up
            if (!mitcoinInfo.balances[winUser.id]) mitcoinInfo.balances[winUser.id] = {
              balance: 0,
              money: 1
            }
        
            // Give the winner their Mitcoin
            mitcoinInfo.balances[winUser.id].balance += winAmount;

            // Show the giveaway in a new embed
            let winEmbed = new Discord.RichEmbed()
            .setColor("#ff9900")
            .setTitle(`${MTC} Giveaway ended!`)
            .addField("Winner", `<@${winUser.id}>`)
            .addField("Amount won", `${winAmount} ${MTC}`)
            .setTimestamp(msg.createdAt)

            message.channel.send(winEmbed);
            
            // Send it in the blockchain
            let embed = new Discord.RichEmbed()
            .setColor("#ff9900")
            .setTitle("Giveaway ended")
            .setAuthor(`${winUser.username}#${winUser.discriminator}`, winUser.displayAvatarURL)
            .addField("Prize", `${winAmount} ${MTC}`)
            .addField("Participants", entries.count - 1)
            .setTimestamp(msg.createdAt);
            
            bot.channels.get(blockchain).send(embed);
          })
        }, ms(time))
      })
    }
  },
  graph: {
    name: "graph",
    alias: ["chart"],
    desc: "Display a graph of recent Mitcoin values",
    run: async (message, args) => {
      // If there isn't any history and thus nothing to display
      if (mitcoinInfo.history.length <= 0) return message.channel.send("There is no value history yet!");

      // How many fluctuations to be shown
      if (args[0] && (!parseInt(args[0]) || args[0] < 1)) return message.channel.send("Specify a valid number of fluctuations");
      let fluctuations = Math.min(Math.floor(args[0]) || maxHistory, maxHistory);
      if (fluctuations > mitcoinInfo.history.length - 1) fluctuations = mitcoinInfo.history.length - 1;

      // Find the data in Mitcoin value history
      let data = mitcoinInfo.history.slice();
      data.splice(0, data.length - fluctuations - 1)
      let labels = [];
      for (let i in data) labels.push(i);

      // Create the graph using ChartJS
      let chartNode = new ChartjsNode(1000, 600);
      return chartNode.drawChart({
        type: "line",
        data: {
          labels: labels,
          datasets: [{
            label: "Value",
            data: data,
            borderColor: "#ff9900",
            pointRadius: 0,
            lineTension: 0,
            fill: false
          }],
        },
        options: {
          legend: {
            display: false
          },
          scales: {
            xAxes: [{
              gridLines: {
                color: "rgba(174, 175, 177, 0.5)"
              },
              ticks: {
                display: false,
                maxTicksLimit: 10
              }
            }],
            yAxes: [{
              gridLines: {
                color: "#aeafb1",
                drawTicks: false
              },
              ticks: {
                padding: 12,
                autoSkipPadding: 32,
                fontColor: "#aeafb1",
                fontFamily: "Helvetica",
                fontSize: 24,
                suggestedMin: mitcoinInfo.value,
                suggestedMax: mitcoinInfo.value,
                stepSize: 0.1,
              }
            }]
          }
        }
      })
      .then(() => {
        return chartNode.getImageBuffer('image/png');
      })
      .then(buffer => {
        Array.isArray(buffer)
        return chartNode.getImageStream('image/png');
      })
      .then(streamResult => {
        streamResult.stream
        streamResult.length
        return chartNode.writeImageToFile('image/png', './mtcgraph.png');
      })
      .then(() => {
        // Format the time
        let time = fluctuations * fluctuationTime;
        let timeString = "";
        if (time >= 86400000) timeString += `${Math.floor(time / 86400000)} day${time > 172800000 ? "s" : ""}, `;
        if (time >= 3600000) timeString += `${Math.floor((time % 86400000) / 3600000)} hour${time % 86400000 > 7200000 ? "s" : ""}, `;
        if (time >= 60000) timeString += `${Math.floor((time % 3600000) / 60000)} ${Math.floor((time % 3600000) / 60000) === 1 ? "minute" : "minutes"}`;

        // Create an embed with the graph
        let embed = {
          "color": 0xFF9900,
          "description": `Mitcoin value over the past ${data.length - 1} fluctuations (${timeString})`,
          "image": {
            "url": "attachment://mtcgraph.png"
          },
          "timestamp": message.createdAt
        };

        // Send the embed using the newly created file
        message.channel.send({
          embed,
          files: [{
            attachment: './mtcgraph.png',
            name: 'mtcgraph.png'
          }]
        });

        // Destroy the chart instance so the command can be used again
        chartNode.destroy();
      });
    }
  },
  help: {
    name: "help",
    run: (message, args) => {
      // Create an embed with all user commands
      let helpEmbed = new Discord.RichEmbed()
      .setDescription("List of commands")
      .setColor("ff9900")
      .addField("Prefix", botconfig.prefix)
      for (let i in commands) {
        if (commands[i].desc) helpEmbed.addField(commands[i].name, commands[i].desc)
      }

      message.channel.send(helpEmbed);
    }
  },
  invest: {
    name: "invest",
    alias: ["buy"],
    desc: "Invest in a certain amount of Mitcoin",
    run: (message, args) => {
      // If the user is blacklisted
      if (mitcoinInfo.blacklist.includes(message.author.id)) return message.reply("you are blacklisted from using Mitcoin");
      
      if (mitcoinInfo.balances[message.author.id].money < 0.01) return message.reply("you can't invest in any Mitcoin!")
      if (!args[0]) return message.channel.send("Specify an amount to invest");

      // How much to invest
      let investAmount = parseFloat(args[0]);
      if (args[0].toLowerCase() === "all") investAmount = mitcoinInfo.balances[message.author.id].money;

      if (!investAmount || investAmount < 0.01) return message.channel.send("Specify a valid amount to invest");
      
      if (investAmount > mitcoinInfo.balances[message.author.id].money) return message.reply("you don't have enough :dollar:");

      // How many times today the user has invested
      if (!investments[message.author.id]) investments[message.author.id] = {
        invested: 0
      };

      // Daily invest limit
      if (investments[message.author.id].invested > 1) return message.reply("you can only invest twice per day");
      investments[message.author.id].invested++;
      setTimeout(function() {
        investments[message.author.id].invested--;
        if (investments[message.author.id].invested > 0) message.reply("you may invest again!");
      }, 86400000);
      
      // Demand increases proportionally to user's balance
      mitcoinInfo.demand += investAmount / mitcoinInfo.balances[message.author.id].money;
      
      // Add the invested amount to the user's balance
      mitcoinInfo.balances[message.author.id].balance += investAmount / mitcoinInfo.value;
      mitcoinInfo.balances[message.author.id].money -= investAmount;

      // If the transaction is at least 100 MTC, give it a 5% tax
      if (investAmount / mitcoinInfo.value >= 100) {
        mitcoinInfo.balances[message.author.id].balance -= investAmount / mitcoinInfo.value * 0.05;

        // Distribute the tax evenly among investment fund holders
        /*for (let i in investmentFunds.users) {
          mitcoinInfo.balances[i].balance += investmentFunds.users[i].amount / investmentFunds.total * investAmount / mitcoinInfo.value * 0.05;
        }*/
      }
      
      // Send the message
      if (mitcoinInfo.balances[message.author.id].money > 0) message.channel.send(`${message.author} has earned ${(investAmount / mitcoinInfo.value * (investAmount / mitcoinInfo.value >= 100 ? 0.95 : 1)).toFixed(3)} ${MTC} after investing ${investAmount.toFixed(3)} :dollar: and has ${(mitcoinInfo.balances[message.author.id].money).toFixed(3)} :dollar: left to invest`);
      else message.channel.send(`${message.author} has earned ${(investAmount / mitcoinInfo.value * (investAmount / mitcoinInfo.value >= 100 ? 0.95 : 1)).toFixed(3)} ${MTC} after investing ${investAmount.toFixed(3)} :dollar: and cannot invest any more :dollar:`);

      // Send it in the blockchain
      let embed = new Discord.RichEmbed()
      .setColor("#ff9900")
      .setAuthor(`${message.author.username}#${message.author.discriminator}`, message.author.displayAvatarURL)
      .addField("Invested", `${investAmount} :dollar:`)
      .addField("Equivalent Amount", `${investAmount / mitcoinInfo.value} ${MTC}`)
      if (investAmount / mitcoinInfo.value >= 100) embed.addField("Tax", `${investAmount / mitcoinInfo.value * 0.05} ${MTC}`)
      .setTimestamp(message.createdAt);
      
      bot.channels.get(blockchain).send(embed);
    }
  },
  invite: {
    name: "invite",
    desc: "Join Mitcoin's server or invite the bot",
    run: (message, args) => {
      // How many humans are in the Mitcoin server
      let serverMembers = 0;
      bot.guilds.get("424284908991676418").members.forEach(member => {
        if (!member.user.bot) serverMembers++;
      })

      // Send an embed for Mitcoin Bot's OAuth link and Mitcoin server invite
      let inviteEmbed = new Discord.RichEmbed().setColor("ff9900").addField("Invite Mitcoin Bot", `[OAuth2 link](https://discordapp.com/api/oauth2/authorize?client_id=430468476038152194&permissions=1878392257&scope=bot 'Mitcoin used in ${bot.guilds.size} servers')`).addField("Official Mitcoin Server", `[yhV8bqz](https://discord.gg/yhV8bqz '${serverMembers} members')`);
      message.channel.send(inviteEmbed);
    }
  },
  leaderboard: {
    name: "leaderboard",
    alias: ["top", "board", "lb"],
    desc: "View the current Mitcoin leaderboard",
    run: (message, args) => {
      // How the leaderboard should sort (MTC by default)
      let type = 0;
      if (args[0] && (args[0].toLowerCase() === "money" || args[0].toLowerCase() === "dollars" || args[0].toLowerCase() === ":dollar:")) type = 1;
      if (args[0] && (args[0].toLowerCase() === "total" || args[0].toLowerCase() === "all")) type = 2;

      // Sort all user balances and store them in the leaderboard
      let leaderboard;
      if (type === 0) leaderboard = Object.values(mitcoinInfo.balances).sort((a, b) => b.balance - a.balance);
      if (type === 1) leaderboard = Object.values(mitcoinInfo.balances).sort((a, b) => b.money - a.money);
      if (type === 2) leaderboard = Object.values(mitcoinInfo.balances).sort((a, b) => (b.money + b.balance * mitcoinInfo.value) - (a.money + a.balance * mitcoinInfo.value));
      
      // If there are no existing user balances
      if (leaderboard[0].balance + leaderboard[0].money === 0) return message.channel.send("No one has any Mitcoin!");
  
      // Set the variable for the usernames of all users on the leaderboard
      let usernames = {
          ids: [],
          usernames: [],
          discriminators: []
      };
  
      // Find the usernames of all leaderboard users
      for (let i = 0; i < Math.min(leaderboard.length, 5); i++) {
          bot.users.forEach(user => {
              if (mitcoinInfo.balances[user.id] && ((type === 0 && mitcoinInfo.balances[user.id].balance === leaderboard[i].balance) || (type === 1 && mitcoinInfo.balances[user.id].money === leaderboard[i].money) || (type === 2 && mitcoinInfo.balances[user.id].money + mitcoinInfo.balances[user.id].balance * mitcoinInfo.value === leaderboard[i].money + leaderboard[i].balance * mitcoinInfo.value)) && !usernames.ids.includes(user.id)) {
                  usernames.ids[i] = user.id;
                  usernames.usernames[i] = user.username;
                  usernames.discriminators[i] = user.discriminator;
              }
          })
          if (!usernames.usernames[i]) {
            leaderboard.splice(i, 1);
            i--;
          }
      }
  
      // Set the variable for what place the user is in
      let userPlace;
  
      // Find what place the user is in
      for (let i = 0; i < leaderboard.length; i++) {
          if ((type === 0 && leaderboard[i].balance === mitcoinInfo.balances[message.author.id].balance) || (type === 1 && leaderboard[i].money === mitcoinInfo.balances[message.author.id].money) || (type === 2 && leaderboard[i].money + leaderboard[i].balance * mitcoinInfo.value === mitcoinInfo.balances[message.author.id].money + mitcoinInfo.balances[message.author.id].balance * mitcoinInfo.value)) {
              userPlace = i + 1;
          }
      }
      
      // Rich embed message to send the leaderboard in
      let lEmbed = new Discord.RichEmbed()
      .setColor("ff9900")
      .setDescription(type === 0 ? "Mitcoin Leaderboard" : type === 1 ? "Money leaderboard" : "Overall leaderboard")
      .setThumbnail(bot.user.displayAvatarURL)
      .addField("First Place", `${usernames.usernames[0]}#${usernames.discriminators[0]} | ${(type === 0 ? leaderboard[0].balance : type === 1 ? leaderboard[0].money : leaderboard[0].money + leaderboard[0].balance * mitcoinInfo.value).toFixed(2)} ${type === 0 ? MTC : ":dollar:"}`)
      if (leaderboard[1] && leaderboard[1].balance + leaderboard[1].money > 0) lEmbed.addField("Second Place", `${usernames.usernames[1]}#${usernames.discriminators[1]} | ${(type === 0 ? leaderboard[1].balance : type === 1 ? leaderboard[1].money : leaderboard[1].money + leaderboard[1].balance * mitcoinInfo.value).toFixed(2)} ${type === 0 ? MTC : ":dollar:"}`)
      if (leaderboard[2] && leaderboard[2].balance + leaderboard[2].money > 0) lEmbed.addField("Third Place", `${usernames.usernames[2]}#${usernames.discriminators[2]} | ${(type === 0 ? leaderboard[2].balance : type === 1 ? leaderboard[2].money : leaderboard[2].money + leaderboard[2].balance * mitcoinInfo.value).toFixed(2)} ${type === 0 ? MTC : ":dollar:"}`)
      if (leaderboard[3] && leaderboard[3].balance + leaderboard[3].money > 0) lEmbed.addField("Fourth Place", `${usernames.usernames[3]}#${usernames.discriminators[3]} | ${(type === 0 ? leaderboard[3].balance : type === 1 ? leaderboard[3].money : leaderboard[3].money + leaderboard[3].balance * mitcoinInfo.value).toFixed(2)} ${type === 0 ? MTC : ":dollar:"}`)
      if (leaderboard[4] && leaderboard[4].balance + leaderboard[4].money > 0) lEmbed.addField("Fifth Place", `${usernames.usernames[4]}#${usernames.discriminators[4]} | ${(type === 0 ? leaderboard[4].balance : type === 1 ? leaderboard[4].money : leaderboard[4].money + leaderboard[4].balance * mitcoinInfo.value).toFixed(2)} ${type === 0 ? MTC : ":dollar:"}`)
      if (userPlace > 5 && (((type === 0 || type === 2) && leaderboard[userPlace - 1].balance > 0) || ((type === 1 || type === 2) && leaderboard[userPlace - 1].money > 1))) lEmbed.addField("Your Place", userPlace)
      lEmbed.setTimestamp(message.createdAt);
  
      message.channel.send(lEmbed);
    }
  },
  logo: {
    name: "logo",
    desc: "See the Mitcoin logo",
    run: (message, args) => {
      // Rich embed to send the logo in
      let logoEmbed = new Discord.RichEmbed()
      .setTitle("Don't Delay. Invest Today!")
      .setColor("ff9900")
      .setImage("https://cdn.discordapp.com/attachments/424284909473890318/519690965104066563/unknown_7.15.17_PM.png");
  
      message.channel.send(logoEmbed);
    }
  },
  /*reset: {
    name: "reset",
    run: (message, args) => {
      // Check if the user is a Mitcoin executive
      if (!executives.includes(message.author.id)) return;
  
      // If the user doesn't specify what to reset
      if (!args[0]) return message.channel.send("Specify what to reset");
  
      // If the argument given is not valid
      if (args[0] !== "value" && args[0] !== "balances" && args[0] !== "all") return message.channel.send("Reset either `value`, `balances`, or `all`")
      
      // Reset the value
      if (args[0] === "value" || args[0] === "all") {
          mitcoinInfo.value = 1;
          mitcoinInfo.history = [];
      }
      // Reset the balances
      if (args[0] === "balances" || args[0] === "all") {
          mitcoinInfo.balances = {};
          sales = {};
          investments = {};
      }
      
      // Send the confirmation message
      if (args[0] !== "all") return message.channel.send(`Mitcoin ${args[0]} reset.`);
      message.channel.send("Mitcoin value and balances reset.");
    }
  },*/
  restore: {
    name: "restore",
    run: (message, args) => {
      if (!args[0] || !executives.includes(message.author.id)) return;
      bot.channels.get("481797287064895489").fetchMessages({after: args[0]}).then(messages => {
        let messagesArray = messages.array().sort((a, b) => a.createdTimestamp - b.createdTimestamp);
        messagesArray.forEach(m => {
          let userID = m.embeds[0].author.iconURL.substring(35, 53);
          if (m.embeds[0].fields[0].name === "Invested") {
            mitcoinInfo.balances[userID].money -= parseFloat(m.embeds[0].fields[0].value.split(" ")[0]);
            mitcoinInfo.balances[userID].balance += parseFloat(m.embeds[0].fields[1].value.split(" ")[0]);
            if (m.embeds[0].fields[2]) mitcoinInfo.balances[userID].balance -= parseFloat(m.embeds[0].fields[2].value.split(" ")[0]);
          }
          else if (m.embeds[0].fields[0].name === "Sold") {
            mitcoinInfo.balances[userID].balance -= parseFloat(m.embeds[0].fields[0].value.split(" ")[0]);
            mitcoinInfo.balances[userID].money += parseFloat(m.embeds[0].fields[1].value.split(" ")[0]);
          }
          else if (m.embeds[0].fields[0].name === "Given") {
            if (!mitcoinInfo.balances[m.embeds[0].fields[2].value.substring(2, 20)]) mitcoinInfo.balances[m.embeds[0].fields[2].value.substring(2, 20)] = {
              balance: 0,
              money: 1
            };
            mitcoinInfo.balances[userID].balance -= parseFloat(m.embeds[0].fields[0].value.split(" ")[0]);
            mitcoinInfo.balances[m.embeds[0].fields[2].value.substring(2, 20)].balance += parseFloat(m.embeds[0].fields[0].value.split(" ")[0]);
          }
          else if (m.embeds[0].title === "Giveaway ended") {
            if (!mitcoinInfo.balances[userID]) mitcoinInfo.balances[userID] = {
              balance: 0,
              money: 1
            };
            mitcoinInfo.balances[userID].balance += parseFloat(m.embeds[0].fields[0].value.split(" ")[0]);
          }
        })
      });
    }
  },
  revive: {
    name: "revive",
    run: async (message, args) => {
      // Check if the user is a Mitcoin executive
      if (!executives.includes(message.author.id)) return;

      message.delete();
      if (!args[0] || !parseInt(args[0])) return message.channel.send("Specify the message ID");
      
      message.channel.fetchMessage(args[0]).then(msg => {
        if (msg.reactions.size <= 0 || msg.content.length > 0 || msg.author.id !== bot.user.id || msg.embeds[0].title !== `New ${MTC} Giveaway!`) return message.channel.send("Message is not a giveaway");
        
        // Determine who reacted to the message
        let entries = msg.reactions.get(MTC.split(/<:|>/)[1]);

        // If no one reacted
        if (!entries || entries.count <= 1) return msg.delete().then(message.channel.send("**No one reacted to the giveaway!**\n__Make sure to react before the time runs out.__"));
        
        // Choose a random winner
        let winner = Math.floor(Math.random() * (entries.count - 1));
        
        // Find which user was the random winner
        let winUser = 0;
        entries.fetchUsers().then(users => {
          users.forEach(r => {
            if (!r.bot && winner <= 0 && winUser === 0) winUser = r;
            winner--;
          })
        }).then(e => {
          // If the winner doesn't have a Mitcoin balance yet, set it up
          if (!mitcoinInfo.balances[winUser.id]) mitcoinInfo.balances[winUser.id] = {
            balance: 0,
            money: 1
          }
          
          let winAmount = parseFloat(msg.embeds[0].fields[0].value);
          
          // Give the winner their Mitcoin
          mitcoinInfo.balances[winUser.id].balance += winAmount;
          
          // Show the giveaway in a new embed
          let winEmbed = new Discord.RichEmbed()
          .setColor("#ff9900")
          .setTitle(`${MTC} Giveaway ended!`)
          .addField("Winner", `<@${winUser.id}>`)
          .addField("Amount won", `${winAmount} ${MTC}`)
          .setTimestamp(msg.createdAt)
          
          msg.delete();
          message.channel.send(winEmbed);
            
          // Send it in the blockchain
          let embed = new Discord.RichEmbed()
          .setColor("#ff9900")
          .setTitle("Giveaway ended")
          .setAuthor(`${winUser.username}#${winUser.discriminator}`, winUser.displayAvatarURL)
          .addField("Prize", `${winAmount} ${MTC}`)
          .addField("Participants", entries.count - 1)
          .setTimestamp(msg.createdAt);
          
          bot.channels.get(blockchain).send(embed);
        })
      }).catch(error => {
        message.channel.send("Specify a valid message ID");
      })
    }
  },
  sell: {
    name: "sell",
    desc: "Sell Mitcoin in return for money",
    run: (message, args) => {
      // If the user is blacklisted
      if (mitcoinInfo.blacklist.includes(message.author.id)) return message.reply("you are blacklisted from using Mitcoin");

      // If the user doesn't have any Mitcoin
      if (mitcoinInfo.balances[message.author.id].balance === 0) return message.reply("you don't have any Mitcoin!");
      
      // If no amount is specified
      if (!args[0]) return message.channel.send("Specify an amount to sell");
      
      let sellAmount = parseFloat(args[0]);
      if (args[0].toLowerCase() === "all") sellAmount = mitcoinInfo.balances[message.author.id].balance;
  
      if (!sellAmount || sellAmount <= 0 || sellAmount === "NaN") return message.channel.send(`Specify a valid number to sell`);
      
      // If the user has less Mitcoin than they say to pay
      if (mitcoinInfo.balances[message.author.id].balance < sellAmount) return message.reply("you don't have enough Mitcoin to sell!");
  
      // Set up for daily cooldown
      if (!sales[message.author.id]) sales[message.author.id] = {
          sales: 0
      }
      
      // Daily sell limit
      if (sales[message.author.id].sales > 1) return message.reply("you can only sell twice per day");
      sales[message.author.id].sales++;
      setTimeout(function() {
          sales[message.author.id].sales--;
          if (sales[message.author.id].sales > 0)
          message.reply("you may sell again!");
      }, 86400000);
      
      // Demand decreases proportionally to user's balance
      mitcoinInfo.demand -= sellAmount / mitcoinInfo.balances[message.author.id].balance;

      // Actually calculate the sale
      mitcoinInfo.balances[message.author.id].balance -= sellAmount;
      mitcoinInfo.balances[message.author.id].money += sellAmount * mitcoinInfo.value;
  
      // Send the confirmation message
      message.channel.send(`${message.author} has sold ${sellAmount.toFixed(3)} ${MTC} and recieved ${(sellAmount * mitcoinInfo.value).toFixed(3)} :dollar:`);

      // Send it in the blockchain
      let embed = new Discord.RichEmbed()
      .setColor("#ff9900")
      .setAuthor(`${message.author.username}#${message.author.discriminator}`, message.author.displayAvatarURL)
      .addField("Sold", `${sellAmount} ${MTC}`)
      .addField("Equivalent Amount", `${sellAmount * mitcoinInfo.value} :dollar:`)
      .setTimestamp(message.createdAt);

      bot.channels.get(blockchain).send(embed);
    }
  },
  uptime: {
    name: "uptime",
    run: (message, args) => {
      let uptimeMsg = "";
      let uptime = (bot.uptime / 100).toFixed(0);

      // Format the time
      if (uptime >= 864000) uptimeMsg += `${Math.floor(uptime / 864000)} day${uptime > 1728000 ? "s" : ""}, `;
      if (uptime >= 36000) uptimeMsg += `${Math.floor((uptime % 864000) / 36000)} hour${uptime % 864000 > 72000 ? "s" : ""}, `;
      if (uptime >= 600) uptimeMsg += `${Math.floor((uptime % 36000) / 600)} minute${(uptime % 36000 > 1200 || uptime % 36000 < 600) ? "s" : ""}, `;
      uptimeMsg += `${(uptime % 600) / 10} seconds`;
      
      message.channel.send(`BOT UPTIME: \`${uptimeMsg}\``);
    }
  },
  value: {
    name: "value",
    desc: "See Mitcoin's current value",
    run: (message, args) => {
    // Calculate the value of a specific amount
    if (parseFloat(args[0]) && parseFloat(args[0]) > 0) return message.channel.send(`${args[0]} ${MTC} is currently worth about ${(mitcoinInfo.value * args[0]).toFixed(3)} :dollar:`);

    // Send the message saying Mitcoin's value
    message.channel.send(`1 ${MTC} is currently worth about ${mitcoinInfo.value.toFixed(3)} :dollar:`);
    }
  }
}

// If the bot encounters an error
bot.on('error', console.error);

// How many times each user has invested for the day
let investments = {};

// How many times each user has sold for the day
let sales = {};

/*
let investmentFunds = {
  total: 0,
  users: {}
};
*/

// When a message is sent
bot.on("message", async message => {
  // If the message was sent in the blockchain, that means mitcoinInfo changed and therefore the database needs to be updated
  if (message.channel.id === blockchain && message.author.bot) updateDatabase(mitcoinInfo, "mitcoin");

  // Ignore the message if it is sent by a bot
  if (message.author.bot) return;
  // Ignore the message if it is send in DM
  if (message.channel.type === "dm") return;
  
  // Set up the user's daily investments
  if (!investments[message.author.id]) investments[message.author.id] = {invested: 0};

  // Bot commands prefix
  let prefix = botconfig.prefix;
  
  // Ignore the message if it doesn't start with the prefix
  if (!message.content.startsWith(prefix)) return;
  
  // Get different parts of the message
  let messageArray = message.content.split(" ");
  let cmd = messageArray[0];
  let args = messageArray.slice(1);
  
  // If the message is a command, run the command
  for (let i in commands) {
    if (commands[i].name === cmd.slice(prefix.length) || (commands[i].alias && commands[i].alias.includes(cmd.slice(prefix.length)))) {
      // If the user doesn't have a Mitcoin balance yet, set it up
      if (!mitcoinInfo.balances[message.author.id]) mitcoinInfo.balances[message.author.id] = {
        balance: 0,
        money: 1
      }

      if (maintenance && message.channel.id !== "495366302542594058" && message.guild.id !== "430340461878575105") return message.channel.send("Sorry, Mitcoin is currently under maintenance. It will be back up shortly!");
      commands[i].run(message, args);
    }
  }

  if (cmd.slice(prefix.length) === "eval") {
    if (message.author.id !== executives[0]) return;
    let code = args.slice(0).join(" ");
    try {
        await eval(code);
    } catch(e) {
        message.channel.send("`" + e.toString() + "`");
    }
  }
});

// Log in to the Discord bot
bot.login(botconfig.token || process.env.BOT_TOKEN);
