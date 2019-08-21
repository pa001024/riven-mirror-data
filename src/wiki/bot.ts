import axios, { AxiosInstance } from "axios";
import * as querystring from "querystring";
import * as FormData from "form-data";
import * as fs from "fs-extra";
import * as path from "path";

interface AskResult {
  printouts: string[];
  fulltext: string;
  fullurl: string;
  namespace: number;
  exists: string;
  displaytitle: string;
}

interface EditResult {
  result: string;
  pageid: number;
  title: string;
  contentmodel: string;
  oldrevid: number;
  newrevid: number;
  newtimestamp: string;
}

interface EditInfo {
  title?: string;
  pageid?: string;
  text: string;
  minor?: boolean;
  nominor?: boolean;
  bot?: boolean;
}

interface DeleteResult {
  title: string;
  reason: string;
  logid: number;
}
interface PurgeResult {
  ns: number;
  title: string;
  purged: string;
}

export class WikiBot {
  user: string;
  session: string;
  token: string;
  BASE = "https://www.huijiwiki.com/";
  get API() {
    return this.BASE + "api.php";
  }
  get RAW() {
    return this.BASE + "index.php?action=raw&title=";
  }
  client: AxiosInstance;
  constructor(wiki: string, user: string, session: string) {
    this.BASE = wiki;
    this.user = user;
    this.session = session;
    this.client = axios.create({
      headers: {
        common: {
          Cookie: `huijiUserID=${user}; huiji_session=${session};`,
        },
        post: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    });
  }
  async apiPagination(url: string) {
    let res = await this.client.get(url);
    if (res) {
      let pages = res.data.query.pages;
      let keys = Object.keys(pages);

      if (keys.length > 0 && keys[0] != "-1") {
        let page = pages[keys[0]];
        return page;
      }
      return;
    }
  }

  /** 获取token */
  async getToken() {
    const rst = await this.client.get(this.API + `?action=query&meta=tokens&format=json`);
    return (this.token = rst.data.query.tokens.csrftoken);
  }

  /** 执行ask */
  async ask(ask: string, offset = 0, limit = 50) {
    const url = this.API + `?action=ask&format=json&query=${encodeURI(ask + `|limit=${limit}|offset=${offset}`)}`;
    const rst = await this.client.get(url);
    console.log("[ASK]", url);
    const results = rst.data.query.results as { [key: string]: AskResult };
    // 自动翻页
    if (rst.data["query-continue-offset"]) {
      const nextPage = await this.ask(ask, rst.data["query-continue-offset"], limit);
      const allPage = { ...results, ...nextPage } as { [key: string]: AskResult };
      return allPage;
    }
    return results;
  }

  /** 编辑或创建页面 */
  async edit(info: EditInfo) {
    const formdata = querystring.stringify({ action: "edit", format: "json", token: this.token, ...info });
    const rst = await this.client.post(this.API, formdata);
    return (rst.data.edit as EditResult) || rst.data;
  }

  /** 获取页面源码 */
  async raw(title: string) {
    try {
      const rst = await this.client.get(this.RAW + encodeURI(title));
      return rst.data as string;
    } catch (e) {
      if (e.message !== "Request failed with status code 404") console.log(e.message);
      return "";
    }
  }

  /** 删除页面 */
  async delete(title: string, reason = "") {
    const formdata = querystring.stringify({ action: "delete", format: "json", token: this.token, title, reason });
    const rst = await this.client.post(this.API, formdata);
    return (rst.data.delete as DeleteResult) || rst.data;
  }

  /** 为指定标题刷新缓存 */
  async purge(options: any) {
    const formdata = querystring.stringify({ action: "purge", format: "json", ...options });
    const rst = await this.client.post(this.API, formdata);
    return (rst.data.purge as PurgeResult[]) || rst.data;
  }

  /** 搬运文件 */
  async transferFile(filename: string, fileurl: string) {
    let url = this.API;
    let res = await this.client.post(
      url,
      querystring.stringify({
        format: "json",
        action: "upload",
        url: fileurl,
        filename,
        comment: `从${fileurl}搬运文件：${filename}。(via nodejs)`,
        text: "",
        token: this.token,
      }),
      { timeout: 5e3 }
    );
    return res.data;
  }

  async uploadFile(filename: string, buffer?: string | fs.ReadStream) {
    let url = this.API;
    const file = typeof buffer !== "string" ? buffer : fs.createReadStream(filename);
    const name = typeof buffer === "string" ? buffer : path.basename(filename);
    let form = new FormData();
    form.append("format", "json");
    form.append("action", "upload");
    form.append("filename", name);
    form.append("ignorewarnings", "true");
    form.append("token", this.token);
    form.append("file", file);
    let res = await this.client.post(url, form, {
      timeout: 10e3,
      headers: form.getHeaders(),
    });
    return res.data;
  }

  // 获取图片的真实地址
  async getImageInfo(filename: string) {
    /** example:
     * rst = {
  batchcomplete: "",
  query: {
    normalized: [{ from: "File:12fce-1.png", to: "\u6587\u4ef6:12fce-1.png" }],
    pages: {
      "1211": {
        pageid: 1211,
        ns: 6,
        title: "\u6587\u4ef6:12fce-1.png",
        imagerepository: "local",
        imageinfo: [
          {
            url: "https://huiji-public.huijistatic.com/arknights/uploads/1/15/12fce-1.png",
            descriptionurl: "https://arknights.huijiwiki.com/wiki/%E6%96%87%E4%BB%B6:12fce-1.png",
            descriptionshorturl: "https://arknights.huijiwiki.com/index.php?curid=1211",
          },
        ],
      },
    },
  },
};
     */
    let api = `${this.API}?action=query&titles=File:${encodeURI(filename)}&prop=imageinfo&&iiprop=url&format=json`;
    let rst = await this.apiPagination(api);
    return rst && (rst.imageinfo[0].url as string);
  }
}
