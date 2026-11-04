// One-off migration: DigitalOcean Spaces -> R2.
//
//   node scripts/cloudflare/copySpacesToR2.js <workDir> [--local] [keys.json]
//
// Copies every object under DO_SPACES_FOLDER, plus any extra keys listed in keys.json (the
// file exportMongo.js writes — the Spaces bucket is shared with other projects, so only what
// this app owns or references is copied). Keys are kept unchanged. Uploads go through
// `wrangler r2 object put` so no R2 API token is needed beyond the wrangler login.

require("dotenv").config({ path: require("path").join(__dirname, "../../.env"), quiet: true });
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require("@aws-sdk/client-s3");

const R2_BUCKET = "masjid-council-uploads";
const args = process.argv.slice(2);
const workDir = args[0];
const local = args.includes("--local");
const keysFile = args.find((a, i) => i > 0 && a.endsWith(".json"));
if (!workDir) {
  console.error("usage: node scripts/cloudflare/copySpacesToR2.js <workDir> [--local] [keys.json]");
  process.exit(1);
}

const s3 = new S3Client({
  region: "us-east-1",
  endpoint: `https://${String(process.env.DO_SPACES_ENDPOINT).replace(/^https?:\/\//, "")}`,
  credentials: { accessKeyId: process.env.DO_SPACES_KEY, secretAccessKey: process.env.DO_SPACES_SECRET },
});
const Bucket = process.env.DO_SPACES_BUCKET;

const listKeys = async (Prefix) => {
  const keys = [];
  let ContinuationToken;
  do {
    const page = await s3.send(new ListObjectsV2Command({ Bucket, Prefix, ContinuationToken }));
    for (const o of page.Contents || []) if (!o.Key.endsWith("/")) keys.push(o.Key);
    ContinuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (ContinuationToken);
  return keys;
};

(async () => {
  fs.mkdirSync(workDir, { recursive: true });
  const keys = new Set(await listKeys(`${process.env.DO_SPACES_FOLDER}/`));
  if (keysFile) for (const k of JSON.parse(fs.readFileSync(keysFile, "utf8"))) keys.add(k);

  const wrangler = path.join(__dirname, "../../node_modules/wrangler/bin/wrangler.js");
  let copied = 0;
  const failed = [];
  for (const key of keys) {
    try {
      const obj = await s3.send(new GetObjectCommand({ Bucket, Key: key }));
      const file = path.join(workDir, `${copied}-${path.basename(key)}`);
      fs.writeFileSync(file, Buffer.from(await obj.Body.transformToByteArray()));
      execFileSync(process.execPath, [
        wrangler, "r2", "object", "put", `${R2_BUCKET}/${key}`,
        "--file", file,
        "--content-type", obj.ContentType || "application/octet-stream",
        "--cache-control", "public, max-age=31536000, immutable",
        local ? "--local" : "--remote",
      ], { stdio: "pipe" });
      fs.unlinkSync(file);
      copied += 1;
    } catch (error) {
      failed.push({ key, error: error.message.split("\n")[0] });
    }
  }
  console.log(`copied ${copied}/${keys.size} objects to ${R2_BUCKET} (${local ? "local" : "remote"})`);
  if (failed.length) {
    console.error("failed:", failed);
    process.exit(1);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
