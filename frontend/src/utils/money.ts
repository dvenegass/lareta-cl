const moneyFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

/** 20000 → "$20.000" */
export const formatMoney = (amount: number) => moneyFormatter.format(amount);
