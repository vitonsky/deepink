export const wait = (time: number) => new Promise<void>((res) => setTimeout(res, time));
