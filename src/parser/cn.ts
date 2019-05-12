import * as fs from "fs-extra";
import * as _ from "lodash";
import { TMP_PREFIX } from "../var";

interface CNDict {
  Text: { [key: string]: string };
  Category: { [key: string]: string };
}

interface CYDict {
  // en, cn, cy, type
  data: [string, string, string, string][];
}

export const convertCN = (cn: CNDict, cy: CYDict) => {
  const di = cn.Text;
  const cydiff = cy.data.filter(v => v[0] && di[v[0]] !== v[2] && v[2] !== "保留" && v[2] !== "暂无").map(v => [v[0], v[2]]);
  let result = {};
  cydiff.forEach(v => (result[_.camelCase(v[0])] = v[1]));
  return result;
};
