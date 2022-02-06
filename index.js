const { Telegraf, Markup } = require("telegraf");
const dotenv = require("dotenv");
dotenv.config();
const path = require("path");
const https = require("https");
const fs = require("fs");
const xlsx = require("xlsx");
const needle = require("needle");
const cheerio = require("cheerio");

const text = require("./const");

const bot = new Telegraf(process.env.BOT_TOKEN);

const dateToday = new Date();

bot.start((ctx) =>
  ctx.reply(
    `Hi ${
      ctx.message.from.first_name
        ? ctx.message.from.first_name
        : "Telegram User"
    }\n${text.start}`
  )
);
bot.help((ctx) => ctx.reply(text.commands));

bot.command("lessons", async (ctx) => {
  try {
    await ctx.replyWithHTML( 
      "<b>Lessons (Your faculty)</b>",
      Markup.inlineKeyboard([
        [Markup.button.callback("IT Faculty", "it")],
        [Markup.button.callback("Management", "management"),Markup.button.callback("Tourism", "tourism")],
        [Markup.button.callback("Finance", "finance"), Markup.button.callback("Logistic", "logistic")]
      ])
      
 
    );
    console.log("lessons");
  } catch (error) {
    console.error(error);
  }
});

botActionAllYears("IT", "it");

botActionAllYears("Mgmt", "management");

botActionAllYears("Tourism", "tourism");

botActionAllYears("Finance", "finance");

botActionAllYears("Logistic", "logistic");
 
 
botAction("it_1"); 
botAction("it_2"); 
botAction("it_3"); 

botAction("management_1"); 
botAction("management_2"); 
botAction("management_3"); 

botAction("tourism_1"); 
botAction("tourism_2"); 
botAction("tourism_3"); 

botAction("finance_1"); 
botAction("finance_2"); 
botAction("finance_3"); 

botAction("logistic_1"); 
botAction("logistic_2"); 
botAction("logistic_3"); 

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

// ==============================================

function botAction(value){
  bot.action(value, async (ctx) => {
    try {
      await ctx.answerCbQuery();
      ctx.reply('Please Write a day in format "day/month/year>"');
      botOn(value);
    } catch (error) {
      console.error(error);
    }
  });
}


function botActionAllYears(nameForUsers , value){
  bot.action(value, async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await ctx.replyWithHTML(
        "Select your year: ",
        Markup.inlineKeyboard([
          [
            Markup.button.callback(`${nameForUsers}-1 year`, `${value}_1`),
            Markup.button.callback(`${nameForUsers}-2 year`, `${value}_2`),
            Markup.button.callback(`${nameForUsers}-3 year`, `${value}_3`),
          ],
        ])
      );
      console.log("years");
    } catch (error) {
      console.error(error);
    }
  });
}


{
const objOfUrlsForDownload = {};
let GlobalValue;
function botOn(value) {
  console.log("value " + value);
  GlobalValue = value;
  get(GlobalValue)
    .then((data) => {
      const $ = cheerio.load(data);
      let res = $(".red-table-header a");
      console.log(value + " egrer");
      objOfUrlsForDownload["1"] = res["0"]["attribs"]["href"];
      objOfUrlsForDownload["2"] = res["1"]["attribs"]["href"];
      objOfUrlsForDownload["3"] = res["2"]["attribs"]["href"];
    })
    .then(() => {
      console.log(objOfUrlsForDownload);

      let url;
      if (value.split("_")[1] == "3") {
        url = "https://handlowa.eu" + objOfUrlsForDownload["3"];
      } else if (value.split("_")[1] == "2") {
        url = "https://handlowa.eu" + objOfUrlsForDownload["2"];
      } else if (value.split("_")[1] == "1") {
        url = "https://handlowa.eu" + objOfUrlsForDownload["1"];
      }

      console.log(url);

      new Promise((resolve, reject) => {
        downloadFile(url, value + ".xlsx");
        console.log("url", url);
        console.log("value", value);

        resolve(value);
      }).then((valueRes) => {
        console.log(value + " before funk ");
        botOnTelegtaf(value);
      });
    });
}

function botOnTelegtaf(thisValue) {
  console.log(thisValue, "thisValue");

  bot.on("text", (ctx) => {
    try {
      console.log(GlobalValue, "test");
      thisValue = GlobalValue;
      let result;
      const usersDate = ctx.message.text;

      console.log("value in bot.on", thisValue);
      const pathToFile = path.join(__dirname, `${thisValue}.xlsx`);

      console.log(path.join(__dirname, `${thisValue}.xlsx`));

      result = getnfo(pathToFile, checkAndFormatDate(usersDate), thisValue);

      ctx.reply(result);
    } catch (e) {
      console.log(e);
      ctx.reply("Sorry , incorrect date /help");
    }
    bot.end;
  });
}

function downloadFile(url, nameOfFile) {
  const file = fs.createWriteStream(nameOfFile);
  const request = https.get(url, function (response) {
    response.pipe(file);
  });
}
 

//  ++++++++++++++++++++++++++++++++
function get(faculty) {
  let URL;
  faculty = faculty.split("_");
  if(faculty[0] === "it"){
    URL = "https://handlowa.eu/dla-studenta/organizacja-roku-akademickiego/informatyka/";

  }else if (faculty[0] === "management") {
    URL = "https://handlowa.eu/dla-studenta/organizacja-roku-akademickiego/zarzadzanie/";
  }
  else if (faculty[0] === "tourism") {
    URL = "https://handlowa.eu/dla-studenta/organizacja-roku-akademickiego/turystyka-i-rekreacja/";
  }
  else if (faculty[0] === "finance") {
    URL = "https://handlowa.eu/dla-studenta/organizacja-roku-akademickiego/finanse-i-rachunkowosc/";

  }else if (faculty[0] === "logistic") {
    URL = "https://handlowa.eu/dla-studenta/organizacja-roku-akademickiego/logistyka/";
  }

  return new Promise((resolve, reject) => {
    needle.get(URL, function (err, res) {
      if (err) reject(err);
      resolve(res.body);
    });
  });
}

// ++++++++++++++++++++++++++++++++

function getnfo(path, date = dateToday, infoAboutYear) {
  let row;
  let dateOfClass;
  let classInfo = "";
  let count = 1;
  //=======================
  if (date === "error") {
    classInfo +=
      'INCORRECT DATE, you have to write in format "day/month/year>", it\'s plan for Today\n\n';
    date = new Date();
  } else if (date === "today"){
    classInfo += 'It\'s plan for Today\n\n';
    date = new Date();
  }else {
    date = new Date(date);
  }

  //===================

  classInfo += `Schedule for ${date.toDateString()} >> ${infoAboutYear.toUpperCase()}\n`;
  
  const wb = xlsx.readFile(path, { cellDates: true });
  const id = wb.SheetNames[0];
  const ws = wb.Sheets[id];
  const dataFromFile = xlsx.utils.sheet_to_json(ws);

  for (let i = 0; i < dataFromFile.length; i++) {
    row = dataFromFile[i];
    dateOfClass = row["Data"];

    if (dateOfClass.getFullYear() === date.getFullYear()) {
      if (dateOfClass.getMonth() === date.getMonth()) {
        if (dateOfClass.getDate() === date.getDate()) {
          let lesson = row["Przedmiot"];
          if (lesson.split(":")[1] != undefined) {
            classInfo += count + ") " + lesson.split(":")[1].trim() + "\n";
          } else {
            classInfo += count + ") " + lesson + "\n";
          }

          let profession =
            lesson.split(" ").indexOf("Gkim:") !== -1
              ? " - Grafika"
              : lesson.split(" ").indexOf("InInt:") !== -1
              ? " - Inzyneria"
              : "";

          count++;
          classInfo += `Type of lesson: ${row["Typ zajęć"].slice(
            0,
            3
          )}\nGroup: ${row["Grupa"]}${profession}\n`;
          classInfo += `Start at ${row["Godzina od"].getHours()}:${row[
            "Godzina od"
          ].getMinutes()}`;
          classInfo += ` to ${row["Godzina do"].getHours()}:${row[
            "Godzina do"
          ].getMinutes()}\n`;
          classInfo += `Cabinet: ${row["Sala"]}\n`;
          classInfo += `Name Of Teacher: ${row["Imię prowadzącego"]} ${row["Nazwisko prowadzącego"]}\n`;
          classInfo += "-----------------------\n";
        }
      }
    }
  }
  return count === 1 ? (classInfo += `Any classes`) : classInfo;
}

//====================================
function checkAndFormatDate(userInput) {
 if (userInput.toLowerCase() === "today") return "today" ;
  userInput = userInput.trim().split("/");

  let corectDate = [userInput[1], userInput[0], userInput[2]];

  return userInput.length === 3 ? corectDate.join("/") : "error";
}
}
 