// @ts-expect-error fengari ships without types
import fengari from "fengari";

const { lua, lauxlib, lualib, to_luastring } = fengari;

type Entry = { value: string; expiresAt: number | null };

export class FakeRedis {
  data = new Map<string, Entry>();
  calls = 0;
  failing = false;

  constructor(public now: () => number = Date.now) {}

  private read(key: string) {
    const entry = this.data.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && entry.expiresAt <= this.now()) {
      this.data.delete(key);
      return null;
    }
    return entry;
  }

  command(args: string[]): unknown {
    const [name, key, ...rest] = args;
    switch (name.toUpperCase()) {
      case "GET":
        return this.read(key)?.value ?? null;
      case "EXISTS":
        return this.read(key) ? 1 : 0;
      case "DEL":
        return this.data.delete(key) ? 1 : 0;
      case "TTL": {
        const entry = this.read(key);
        if (!entry) return -2;
        if (entry.expiresAt === null) return -1;
        return Math.round((entry.expiresAt - this.now()) / 1000);
      }
      case "EXPIRE": {
        const entry = this.read(key);
        if (!entry) return 0;
        entry.expiresAt = this.now() + Number(rest[0]) * 1000;
        return 1;
      }
      case "INCRBY":
      case "DECR": {
        const entry = this.read(key);
        const by = name.toUpperCase() === "DECR" ? -1 : Number(rest[0]);
        const value = Number(entry?.value ?? 0) + by;
        if (!Number.isInteger(value)) throw new Error("ERR value is not an integer");
        this.data.set(key, { value: String(value), expiresAt: entry?.expiresAt ?? null });
        return value;
      }
      case "SET": {
        const previous = this.read(key);
        let expiresAt: number | null = null;
        for (let index = 1; index < rest.length; index++) {
          const option = rest[index].toUpperCase();
          if (option === "PX") expiresAt = this.now() + Number(rest[++index]);
          if (option === "KEEPTTL") expiresAt = previous?.expiresAt ?? null;
        }
        this.data.set(key, { value: rest[0], expiresAt });
        return { ok: "OK" };
      }
      default:
        throw new Error(`Unsupported command ${name}`);
    }
  }

  eval(script: string, keys: string[], argv: string[]): unknown {
    const L = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(L);

    const pushValue = (value: unknown) => {
      if (value === null || value === undefined) lua.lua_pushboolean(L, false);
      else if (typeof value === "number") lua.lua_pushinteger(L, value);
      else if (typeof value === "string") lua.lua_pushstring(L, to_luastring(value));
      else if (typeof value === "object" && "ok" in (value as object)) {
        lua.lua_createtable(L, 0, 1);
        lua.lua_pushstring(L, to_luastring((value as { ok: string }).ok));
        lua.lua_setfield(L, -2, to_luastring("ok"));
      }
    };

    lua.lua_createtable(L, 0, 1);
    lua.lua_pushcfunction(L, (state: unknown) => {
      const count = lua.lua_gettop(state);
      const args: string[] = [];
      for (let index = 1; index <= count; index++) args.push(lua.lua_tojsstring(state, index));
      pushValue(this.command(args));
      return 1;
    });
    lua.lua_setfield(L, -2, to_luastring("call"));
    lua.lua_setglobal(L, to_luastring("redis"));

    for (const [name, list] of [["KEYS", keys], ["ARGV", argv]] as const) {
      lua.lua_createtable(L, list.length, 0);
      list.forEach((value, index) => {
        lua.lua_pushstring(L, to_luastring(value));
        lua.lua_rawseti(L, -2, index + 1);
      });
      lua.lua_setglobal(L, to_luastring(name));
    }

    if (lauxlib.luaL_loadstring(L, to_luastring(script)) !== lua.LUA_OK) {
      throw new Error(lua.lua_tojsstring(L, -1));
    }
    if (lua.lua_pcall(L, 0, 1, 0) !== lua.LUA_OK) throw new Error(lua.lua_tojsstring(L, -1));

    const read = (index: number): unknown => {
      const type = lua.lua_type(L, index);
      if (type === lua.LUA_TNUMBER) return Math.trunc(lua.lua_tonumber(L, index));
      if (type === lua.LUA_TSTRING) return lua.lua_tojsstring(L, index);
      if (type === lua.LUA_TBOOLEAN) return lua.lua_toboolean(L, index) ? 1 : null;
      if (type === lua.LUA_TTABLE) {
        const out: unknown[] = [];
        const length = lua.lua_rawlen(L, index);
        for (let item = 1; item <= length; item++) {
          lua.lua_rawgeti(L, index, item);
          out.push(read(lua.lua_gettop(L)));
          lua.lua_pop(L, 1);
        }
        return out;
      }
      return null;
    };
    return read(lua.lua_gettop(L));
  }

  fetch: typeof fetch = async (_url, init) => {
    this.calls++;
    if (this.failing) return new Response("unavailable", { status: 503 });
    const args = JSON.parse(String(init?.body)) as (string | number)[];
    if (args[0] !== "EVAL") return Response.json({ error: "unsupported" });
    const count = Number(args[2]);
    const keys = args.slice(3, 3 + count).map(String);
    const argv = args.slice(3 + count).map(String);
    try {
      return Response.json({ result: this.eval(String(args[1]), keys, argv) });
    } catch (error) {
      return Response.json({ error: String(error) });
    }
  };
}
