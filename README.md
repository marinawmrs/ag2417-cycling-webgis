# ag2417-cycling-webgis

This project is called **bikeable**, a simple app designed to help cyclists in Stockholm find and navigate to the closest bike pumps and bike parking. 
The app allows users to select routes that prioritise cycle paths. 
Additionally, it supports ratings and basic respective statistics for pump and parking status, safety and availability. 
A night mode feature notifies the user after dark to turn lights on and displays street lighting in the app.  

The app is built with **Express.js** for the backend and **React Native** for the mobile frontend. 
It supports both iOS and Android devices. Since the app is not published, it can be emulated using **Expo Go**, 
which allows scanning a QR code to run the app on a mobile device.

The project was developed as part of the **AG2417 Web and Mobile GIS** course.  

#### Contributors
- Leonard Haas
- Johanna Schaefer
- Marina Wiemers  


---

## Running the Web App Locally

1. clone the repository
   ```
   git clone [repo-url]
   cd ag2417-cycling-webgis
   ``` 
2. install backend dependencies
    ```
    cd server
    npm install
    ```
3. Create `config.json` in the project root (see below) using the database credentials provided by the teaching assistant 
4. run the server locally
    ```
    cd ..
    node server/server.js
    ```
5. navigate to the bikeapp and install frontend dependencies
    ```
    cd bikeapp
    npm install
    ```
6. adjust or create `conn.json` in the bikeapp folder (see below)

7. run expo 
    ```
    npx expo start
    ```
8. scan the QR code with the Expo Go app (Android) or camera (iOS)


--- 

### DB and app connection secrets
Create `config.json` file under project root with the following structure:
  ```
  {
    "app": {
      "api_base_IP": "[IP address]",
      "port": "3000"
    },
    "database": {
      "host": "[DB host]",
      "port": [DB port],
      "user": "[DB user]",
      "password": "[DB password]"
    },
    "api_keys": {
      "sth_stad": "[API key]"
    }
  }
  ```
  
Create `conn.json` under the bikeapp root (needed because EAS cannot access `config.json`):
```
{
  "app": {
    "api_base_IP": "[IP address]",
    "port": "3000"
  }
}
```


### File structure

The project is divided into app (client-side) and server directories.

#### App (React Native)

- App.js, index.js, and configuration files (app.json, eas.json, package.json) define the app entry point and setup.
- Assets contain images and icons used in the app.
- Components contain reusable UI elements rendered on screens, such as markers, modals, and navigation buttons.
- Screens include MapScreen (general map view) and RouteScreen (routing interface for selecting start/end points and visualising paths)
- Utils contain helper functions, e.g., fetching data from the server or notifications.

#### Server (Express.js)

`server.js` is the main server file, while the files in `routes/` handle API endpoints for bike routing, pumps, parking, and ratings, based on the organisation of database tables/WFS endpoints. 

#### Project tree
```
.
├── README.md
├── bikeapp
│   ├── App.js
│   ├── app.json
│   ├── conn.json
│   ├── eas.json
│   ├── index.js
│   ├── package.json
│   ├── package-lock.json
│   ├── assets
│   ├── components/
│   ├── screens/
│   └── utils/
├── config.json
└── server
    ├── package.json
    ├── package-lock.json
    ├── server.js
    └── routes/
```

