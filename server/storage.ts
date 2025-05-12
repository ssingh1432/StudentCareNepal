// keep other imports the same
import session from "express-session";

export interface IStorage {
  ...

  sessionStore: session.SessionStore;
}

// adapt the IStorage implementation to account for the session store
// for example with a database:
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  ...

  constructor() {
    this.sessionStore = new PostgresSessionStore({ pool, createTableIfMissing: true });
  }
}

// or in memory:
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  ...

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }
}