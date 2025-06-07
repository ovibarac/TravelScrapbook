# Deploy
Create ec2 instance and connect (create and save the key locally)

    ssh -i licenta-server-key.pem ec2-user@<ec2-address>

Clone be to ec2 instance.

Create RDS instance with Postgres.

Create S3 bucket with static hosting enabled. 

Create CloudFront distribution that points to the bucket.

In fe change the `API_URL` in `src/config/constants` to `https://<ec2-address>:3000`

Build fe with `npm run build` and ulpoad the files in `/dist`

Create Google Cloud project with OAuth2.0 Client ID. Set the `https://<cloudfront-address>` as _Authorized JavaScript origins_. Add `https://<ec2-address>:3000/auth/google/callback` as _Authorized redirect URIs_. Copy `CLIENT_ID` and `CLIENT_SECRET`

Create `.env` in be root with this structure:

    DATABASE_URL="postgresql://postgres:postgres@<rds-address>:5432/mydb"
    CLIENT_ID=""
    CLIENT_SECRET=""
    SERVER_URL="https://<ec2-adress>"
    CLIENT_URL="https://<cloudfront-address>"
    PORT="3000"

Create ssl self signed key and cert in `/home/ec2-user/ssl/key.pem` and `/home/ec2-user/ssl/cert.pem`
Need this because https is required with OAuth2.0. When making a request, you need to approve the self signed certificate in the browser.

Migrate db

    npx prisma migrate dev
