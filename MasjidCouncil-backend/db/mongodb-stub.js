// Stand-in for the `mongodb` package inside the Worker bundle (wired up through `alias` in
// wrangler.jsonc). Mongoose's default driver requires it at load time, but the app swaps that
// driver for db/d1Driver.js before any query runs, so nothing here is ever called. Aliasing
// it away keeps the native driver — and its TCP/TLS/DNS dependencies — out of the bundle.

class Unsupported {
  constructor() {
    throw new Error("The MongoDB driver is not available in this build; data lives in Cloudflare D1");
  }
}

module.exports = {
  Collection: class Collection {},
  MongoClient: Unsupported,
  ClientEncryption: Unsupported,
};
