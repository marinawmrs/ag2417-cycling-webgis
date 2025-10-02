# ag2417-cycling-webgis

### To run the web app locally
- clone the repository
- - run the server locally
  - `node server/server.js`
- navigate to the bikeapp directory
- run the following code to install node and postgres:
  - `npm install express pg`
- run the app locally
  - `npx expo start`
- scan the QR code with the Expo Go app on mobile

### DB and app connection secrets
- create `config.json` file under project root with the following structure:
```
{
   "app": {
    "api_base_IP": "192.168.10.106",
    "port": "3000"
  },
  "database": {
    "host": "[...]",
    "port": [...],
    "user": "[...]",
    "password": "[...]"
  },
  "api_keys": {
    "sth_stad": "[...]"
  }
}
```
- additionally, create `conn.json` under the bikeapp root (bc eas can't reach the previous file):
```
{
  "app": {
    "api_base_IP": "[IP address]",
    "port": "3000"
  }
}
```