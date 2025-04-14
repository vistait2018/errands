export const getEnumKeyByValue = (enumObj: object, value: string): string | undefined => {
  return (enumObj as any)[value]
}
