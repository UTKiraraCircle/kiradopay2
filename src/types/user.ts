import { Type } from "@sinclair/typebox";
import type { Route } from "./route";

export const User = Type.Object({
  sub: Type.String(),
  email: Type.String(),
  name: Type.String(),
  picture: Type.String(),
});

export const readUsersMe = {
  method: "GET",
  path: "/api/users/me",
  response: User,
} satisfies Route;
