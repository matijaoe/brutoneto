export const convertFromPercentage = (value: string) => {
  return parseFloat(value.replace("%", "")) / 100
}
