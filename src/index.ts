import fetch from "./fetch";
import build from "./build";
import clean from "./clean";

const main = async () => {
  if (process.argv[2] === "fetch") {
    await fetch();
  } else if (process.argv[2] === "clean") {
    await clean();
  } else {
    await build();
  }
};

main();
