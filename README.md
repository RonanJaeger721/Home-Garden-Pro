# Home & Garden Pro

Editorial catalogue website for Home & Garden Pro, a Zimbabwean concrete garden pots, sculptures and water features business in Helensvale, Harare.

## Public site

Serve the project with Vercel or a local HTTP server. The source catalogue in `data/catalog.json` remains visible when the live catalogue API is unavailable.

## Catalogue studio

The unlinked `/admin/` workspace manages catalogue items, packages, images, visibility and optional public estimate ranges. Access is checked inside Vercel Functions using a slow password hash; the access key is never stored in the repository or browser local storage.

Private access remains disabled until the owner supplies a password. Configure only these server-side environment variables when that happens:

- `HGP_ADMIN_PASSWORD_SALT`: a random hexadecimal salt
- `HGP_ADMIN_PASSWORD_HASH`: a 64-character PBKDF2-SHA256 hash using 210,000 iterations

No default password or fallback credential exists in the public source.

Vercel Blob provides durable catalogue and image storage. The project expects `BLOB_READ_WRITE_TOKEN`, which is created automatically when its Blob store is connected in Vercel.

```powershell
npm install
vercel dev
```
