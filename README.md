# ag2417-cycling-webgis

### To run the web app locally
- clone the repository
- navigate to the directory
- run the following code to install node and postgres:
  - `npm install express pg`
- run the app locally
  - `node app.js`

### DB connection secrets
- create `config.json` file under project root with the following structure:
```
{
  "app": {
    "port": 3000
  },
  "database": {
    "host": "[...]",
    "port": [...],
    "user": "[...]",
    "password": "[...]"
  }
}
```