# Travel Scrapbook

## Overview
Travel Scrapbook is a full-stack photo management app made using Express.js and React, meant to streamline the process of managing and organizing travel photos. It allows users to batch upload photos to the cloud, using AWS to store user data in the cloud, and the user's personal Google Drive in order to keep their photos secure. The app automatically creates easy to manage photo albums based on image location using clustering. The albums have a user-friendly interface that allows captioning photos, browsing by date and by location using an interactive map.

## Features
- **User Authentication**: Secure and easy login with the user’s Google account using OAuth2.0.
- **Photo Upload**: Allow users to upload multiple photos and store them in their personal cloud storage.
- **Trip Creation**: Automatically group photos into trip albums on upload based on location metadata. Saves trips to backend database.
- **Edit Captions**: Add or edit captions for photos.
- **Interactive map**: Browse photos based on location using an interactive map.
- **Cross-platform**: Use Ionic for cross-platform compatibility.
- **Cloud hosting**: Use AWS to host the app on the cloud.


## Technologies

### Front-end
- React
- TypeScript
- Ionic
- Libraries: react-hook-form, chakra-ui

### Back-end
- Express.js
- Database: PostgreSQL using the Prisma ORM
- Authentication: Google OAuth 2.0
- Photo storage: Google Drive API
- Libraries: google-auth-library, googleapis, exif-parser, cdxoo/dbscan

### Project
- Package Management: NPM was used for managing node packages
- Version Control: Git and GitHub
- Code quality: ESLint and Prettier

### Cloud deployment
AWS services:
 - **Back-end hosting**: EC2
 - **Database management**: RDS
 - **Front-end hosting**: S3, CloudFront

   
## Deployment
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


## Screenshots
<img width="355" height="805" alt="Screenshot from 2024-06-08 20-06-28" src="https://github.com/user-attachments/assets/e01179b0-b879-4266-b814-0522f63214a2" />

<img width="355" height="805" alt="Screenshot from 2024-06-08 20-07-26" src="https://github.com/user-attachments/assets/c534353f-bba0-4467-ad52-5135be00748c" />

<img width="315" height="208" alt="Screenshot from 2024-06-08 20-31-05" src="https://github.com/user-attachments/assets/f898d849-3b9d-4fd0-b1ec-536bff34dee0" />
