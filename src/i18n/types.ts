import type { Dictionary } from "./dictionaries/en";

export type DeepPartial<T> = T extends readonly (infer U)[]
  ? readonly DeepPartial<U>[] | U[]
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

export type PartialDictionary = DeepPartial<Dictionary>;
export type { Dictionary };
