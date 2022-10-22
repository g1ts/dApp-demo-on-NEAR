import { storage, logging, PersistentVector } from "near-sdk-as";


export function get_value(): i8 {
  return storage.getPrimitive<i8>("value", 0);
}

export function set_value(value: i8): void {
  storage.set<i8>("value", value);
  logging.log("Set value to " +  value.toString());
}
