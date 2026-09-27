# Home & Garden Pro

Editorial catalogue website for Home & Garden Pro, a Zimbabwean concrete garden pots, sculptures and water features business in Helensvale, Harare.

## Public site

Serve the project with Vercel or a local HTTP server. The source catalogue in `data/catalog.json` remains visible when the live catalogue API is unavailable.

## Catalogue studio

The discreet `/admin/` workspace manages products, visibility, featured status, images, custom size options, public price ranges and the shared WhatsApp catalogue URL. A successful server-side login creates a signed, expiring, HttpOnly cookie; credentials and authorization state are never stored in the public bundle or browser storage.

Configure these server-only environment variables:

- `HGP_ADMIN_EMAIL`: the verified primary Home & Garden Pro business email
- `HGP_ADMIN_PASSWORD_SALT`: a random hexadecimal salt
- `HGP_ADMIN_PASSWORD_HASH`: a 64-character PBKDF2-SHA256 hash using 210,000 iterations
- `HGP_ADMIN_SESSION_SECRET`: a random secret of at least 32 characters used to sign sessions

Admin access remains disabled until every variable is configured. No fallback email, password or session secret exists in the source.

Vercel Blob provides durable catalogue and image storage. The project expects `BLOB_READ_WRITE_TOKEN`, which is created automatically when its Blob store is connected in Vercel.

```powershell
npm install
vercel dev
```
