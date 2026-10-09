// Навмисно без Intl: Node у контейнері й браузер по-різному форматують UAH
// ("грн" проти "₴", "1 тис." проти "1,0 тис."), і в клієнтських компонентах
// це ламало гідратацію. Серверні компоненти можуть лишатись на Intl.
function group(int: string) {
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** 1494 -> "1 494", 12.5 -> "12,5" (зайві нулі справа прибираються). */
export function formatNumber(n: number) {
  const [int, frac] = n.toFixed(2).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "").split(".");
  return frac ? `${group(int)},${frac}` : group(int);
}

/** 500 -> "500,00 ₴" (завжди дві копійки — для цін). */
export function formatMoney(n: number) {
  const [int, frac] = n.toFixed(2).split(".");
  return `${group(int)},${frac} ₴`;
}
