// Bot setup
const botconfig = require("./botconfig.json");
const Discord = require("discord.js");
const fs = require("fs");
const bot = new Discord.Client({disableEveryone: true});
bot.commands = new Discord.Collection();

fs.readdir("./commands", (err, files) => {

  if (err) console.log(err);

  let jsfile = files.filter(f => f.split(".").pop() === "js");
  if (jsfile.length <= 0) {
    console.log("Couldn't find commands.");
    return;
  }

  jsfile.forEach((f, i) => {
    let props = require(`./commands/${f}`);
    bot.commands.set(props.help.name, props);
    console.log(`${f} loaded!`);
  });

});

// Automatically fluctuate Mitcoin's value
setInterval(function() {
  let fluctuation = Math.round(Math.random() * 10 - 5);

  let mitcoinInfo = require("./mitcoininfo.json");

  // Change Mitcoin's value
  mitcoinInfo.value *= (fluctuation + 100) / 100;
  bot.user.setActivity(`MTC Value: ${mitcoinInfo.value.toFixed(2)} | m/help`);
  
  fs.writeFileSync("./mitcoininfo.json", JSON.stringify(mitcoinInfo));
}, 600000);

// When the bot is loaded
bot.on("ready", async () => {
  console.log(`${bot.user.username} is online in ${bot.guilds.size} servers!`);
  let mitcoinInfo = require("./mitcoininfo.json");
  bot.user.setActivity(`MTC Value: ${mitcoinInfo.value.toFixed(2)} | m/help`);
  
  let PotatOS = bot.users.find("id", "286664522083729409");
  PotatOS.send("Update mitcoininfo!");
});

// How much each user has invested for the day
let investments = {};

// When a message is sent
bot.on("message", async message => {
  // Ignore the message if it is sent by a bot
  if (message.author.bot) return;
  // Ignore the message if it is send in DM
  if (message.channel.type === "dm") return;

  // File for Mitcoin value and all user balances
  let mitcoinInfo = require("./mitcoininfo.json");

  // Set up what the Mitcoin file has
  mitcoinInfo = {
    value: mitcoinInfo.value || 1,
    balances: mitcoinInfo.balances || {}
  }

  // If the user doesn't have a Mitcoin balance yet, set it up
  if (!mitcoinInfo.balances[message.author.id]) mitcoinInfo.balances[message.author.id] = {
    balance: 0,
    money: 1
  }
  
  // Get different parts of the message
  let prefix = botconfig.prefix;
  let messageArray = message.content.split(" ");
  let cmd = messageArray[0];
  let args = messageArray.slice(1);
  
  let logChannel = bot.channels.find("id", "446758326035021824");

  // Set up the user's daily investments
  if (!investments[message.author.id]) investments[message.author.id] = {invested: 0};
  
  // The maximum amount that can be invested daily
  let dailyInvest = 10;
  
  // Ignore the message if it doesn't start with the prefix
  if (!message.content.startsWith(prefix)) {
    // If the user invests using the dollar emoji
    if (message.content.split(/💵| /).length - 1 === (message.content.length + message.content.split(" ").length - 1) / 2 && message.content.length > 0) {
      // Calculate how much was invested
      let investAmount = message.content.split("💵").length - 1;

      if (investAmount > 3) message.reply("you can only invest in 1, 2, or 3 :dollar: at a time");
      else if (investAmount > mitcoinInfo.balances[message.author.id].money) message.reply("you don't have enough :dollar:");
      else {      
        
        // If the user has already reached their daily investment limit
        if (investments[message.author.id].invested + investAmount > dailyInvest) message.reply(`you can only invest ${dailyInvest} :dollar: per day`)
        else {
          // Wait a day after the user invested to let them invest again
          setTimeout(function() {
            investments[message.author.id].invested -= investAmount;
            if (investments[message.author.id].invested + investAmount === dailyInvest) message.reply("you may invest again!");
          }, 86400000);

          // Add the invested amount to the user's daily investments
          investments[message.author.id].invested += investAmount;

          // Add the invested amount to the user's balance
          mitcoinInfo.balances[message.author.id].balance += investAmount / mitcoinInfo.value;
          mitcoinInfo.balances[message.author.id].money -= investAmount;

          // Send the message
          if (mitcoinInfo.balances[message.author.id].money >= 1) message.channel.send(`${message.author} has earned ${(investAmount / mitcoinInfo.value).toFixed(3)} <:MTC:449007845954945026> after investing ${investAmount} :dollar: and has ${(mitcoinInfo.balances[message.author.id].money).toFixed(2)} :dollar: left to invest`);
          else message.channel.send(`${message.author} has earned ${(investAmount / mitcoinInfo.value).toFixed(3)} <:MTC:449007845954945026> after investing ${investAmount} :dollar: and cannot invest any more :dollar:`);

          logChannel.send(JSON.stringify(mitcoinInfo));
        }
      }
    }
  }
  // Save the Mitcoin file
  fs.writeFileSync("./mitcoininfo.json", JSON.stringify(mitcoinInfo));
  
  // If the message is a command, run the command
  if (message.content.startsWith(prefix)) {
    let commandfile = bot.commands.get(cmd.slice(prefix.length));
    if (commandfile) commandfile.run(bot, message, args);
  }

  if (message.content.startsWith(`${prefix}eval`)) {
    if (message.author.id !== "286664522083729409") return;
    let code = args.slice(0).join(" ");
    try {
        await eval(code);
    } catch(e) {
        message.channel.send("`" + e.toString() + "`");
    }
  }
});

// Log in to the Discord bot
bot.login(process.env.BOT_TOKEN);
