const { Telegraf, Markup } = require("telegraf");
const dotenv = require("dotenv");
dotenv.config();
const path = require("path");
const https = require("https");
const fs = require("fs");
const xlsx = require("xlsx");

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
      "<b>Lessons</b>",
      Markup.inlineKeyboard([[Markup.button.callback("IT faculty", "it_all")]])
    );
  } catch (error) {
    console.error(error);
  }
});

bot.action("it_all", async (ctx) => {
  try {
    await ctx.answerCbQuery();
    await ctx.replyWithHTML(
      "Select your year: ",
      Markup.inlineKeyboard([
        [
          Markup.button.callback("IT-1 year", "it_1"),
          Markup.button.callback("IT-2 year", "it_2"),
          Markup.button.callback("IT-3 year", "it_3"),
        ],
      ])
    );
  } catch (error) {
    console.error(error);
  }
});

bot.action("it_3", async (ctx) => {
  try {
    await ctx.answerCbQuery();
    ctx.reply('Please Write a day in format "day/month/year>"');
    botOn("it_3");
  } catch (error) {
    console.error(error);
  }
});

bot.action("it_2", async (ctx) => {
  try {
    await ctx.answerCbQuery();
    ctx.reply('Please Write a day in format "day/month/year>"');
    botOn("it_2");
  } catch (error) {
    console.error(error);
  }
});
bot.action("it_1", async (ctx) => {
  try {
    await ctx.answerCbQuery();
    ctx.reply('Please Write a day in format "day/month/year>"');
    botOn("it_1");
  } catch (error) {
    console.error(error);
  }
});

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

function botOn(value) {
  let url;
  if (value == "it_3") {
    url =
      "https://handlowa.eu/assets/dokumenty/studia/harmonogramy-zajec/AKTUALIZACJE/05-01/INF/4.01-Informatyka-studia-pierwszego-stopnia-stacjonarne-semestr-5.xlsx";
  } else if (value == "it_2") {
    url =
      "https://handlowa.eu/assets/dokumenty/studia/harmonogramy-zajec/AKTUALIZACJE/21-01/21.01-Informatyka-studia-pierwszego-stopnia-stacjonarne-semestr-3.xlsx";
  } else if (value == "it_1") {
    url =
      "https://handlowa.eu/assets/dokumenty/studia/harmonogramy-zajec/AKTUALIZACJE/05-01/INF/4.01-Informatyka-studia-pierwszego-stopnia-stacjonarne-semestr-1.xlsx";
  }

  new Promise((resolve, reject) => {
    resolve(downloadFile(url, value + ".xlsx"));
  }).then(() => {
    bot.on("text", (ctx) => {
      try {
        let result;
        const usersDate = ctx.message.text;
        console.log("before path");

        const pathToFile = path.join(__dirname, `${value}.xlsx`);
        console.log("after path");
        console.log(path.join(__dirname, `${value}.xlsx`));

        result = test(pathToFile, checkAndFormatDate(usersDate));

        ctx.reply(result);
      } catch (e) {
        console.log(e);
        ctx.reply("Sorry , incorrect date /help");
      }
    });
  });
}

function downloadFile(url, nameOfFile) {
  const file = fs.createWriteStream(nameOfFile);
  const request = https.get(url, function (response) {
    response.pipe(file);
  });
}

function test(path, date = dateToday) {
  let row;
  let dateOfClass;
  let classInfo = "";
  let count = 1;
  //=======================
  if (date === "error") {
    classInfo +=
      'INCORRECT DATE, you have to write in format "day/month/year>", it\'s plan for Today\n\n';
    date = new Date();
  } else {
    date = new Date(date);
  }

  //===================

  classInfo += `Schedule for ${date.toDateString()} \n`;
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
  userInput = userInput.trim().split("/");

  let corectDate = [userInput[1], userInput[0], userInput[2]];

  return userInput.length === 3 ? corectDate.join("/") : "error";
}
