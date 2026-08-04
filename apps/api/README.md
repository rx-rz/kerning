```
npm install
npm run dev
```

```
open http://localhost:3000
```

## Cloudflare R2 browser uploads

The web app uploads local font files directly to presigned R2 URLs. Apply the
bucket CORS policy before testing uploads in a browser:

```sh
npx wrangler r2 bucket cors set <BUCKET_NAME> --file r2-cors.json
npx wrangler r2 bucket cors list <BUCKET_NAME>
```

Use the bucket configured by `CLOUDFLARE_BUCKET_NAME`. The policy permits the
local web origin and the production origins to upload files with a
`Content-Type` header and to load the resulting font objects.
