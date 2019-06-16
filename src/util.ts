export const purge = <T>(a: T) => {
  Object.keys(a).forEach(v => typeof a[v] === "undefined" && delete a[v]);
  return a;
};
