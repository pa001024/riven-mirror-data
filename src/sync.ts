import * as chalk from "chalk";
import { TMP_PREFIX, TARGET_PREFIX, PROTO_PREFIX, PATCH_PREFIX } from "./var";
import * as _ from "lodash";
import * as fs from "fs-extra";
import { WikiBot } from "./wiki/bot";
import { formatJSON } from "./util";

require("dotenv").config();

const purgeWithTemplate = async (bot: WikiBot, tplName: string) => {
  const rst = await bot.purge({ generator: "transcludedin", titles: tplName, gtilimit: 500 });
  console.log(formatJSON(rst));
};

const job = async () => {
  const bot = new WikiBot("https://warframe.huijiwiki.com/", process.env.user, process.env.session);

  await purgeWithTemplate(bot, "template:ModBox");
  console.log(chalk.green("[purge]"), "All Finished");
};

job();
