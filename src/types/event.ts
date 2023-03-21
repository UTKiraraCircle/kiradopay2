import { Static, Type } from "@sinclair/typebox";
import { Item } from "./item";
import type { Route } from "./route";
import { Code, Date, Name } from "./common";

export const Event = Type.Object({
  code: Code,
  name: Name,
  date: Date,
  calculator: Type.String(),
  items: Type.Array(Item),
});

export type Event = Static<typeof Event>;

export const CreateEvent = Type.Object({
  code: Code,
  name: Name,
  date: Date,
  calculator: Type.Optional(Type.String()),
});

export type CreateEvent = Static<typeof CreateEvent>;

export const UpdateEvent = Type.Partial(CreateEvent);

export type UpdateEvent = Static<typeof UpdateEvent>;

export const readEvents = {
  method: "GET",
  path: "/api/events",
  response: Type.Array(Event),
} satisfies Route;

export const createEvent = {
  method: "POST",
  path: "/api/events",
  body: CreateEvent,
  response: Event,
} satisfies Route;

export const readEvent = {
  method: "GET",
  path: "/api/events/[eventcode]",
  params: Type.Object({ eventcode: Code }),
  response: Event,
} satisfies Route;

export const updateEvent = {
  method: "PATCH",
  path: "/api/events/[eventcode]",
  params: Type.Object({ eventcode: Code }),
  body: UpdateEvent,
  response: Event,
} satisfies Route;
