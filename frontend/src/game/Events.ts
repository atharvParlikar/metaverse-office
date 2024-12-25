/* eslint-disable @typescript-eslint/no-explicit-any */
import { GameObject } from "./GameObject";

type Store = {
  id: number;
  eventName: string;
  caller: GameObject;
  callback: (value: any) => void;
};

class Events {
  stores: Store[] = [];
  nextId: number = 0;

  // emit event
  emit(eventName: string, value: any) {
    this.stores.forEach((stored) => {
      if (stored.eventName === eventName) {
        stored.callback(value);
      }
    });
  }

  // subscribe to something happening
  on(eventName: string, caller: GameObject, callback: (value: any) => void) {
    this.nextId++;
    this.stores.push({
      id: this.nextId,
      eventName,
      caller,
      callback,
    });

    return this.nextId;
  }

  // remove the subscription
  off(id: number) {
    this.stores = this.stores.filter((stored) => stored.id !== id);
  }

  unsubscribe(caller: GameObject) {
    this.stores = this.stores.filter((stored) => stored.caller !== caller);
  }
}

export const events = new Events();
