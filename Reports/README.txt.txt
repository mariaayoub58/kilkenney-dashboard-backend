1) Once the code is cloned, do an npm install, this step will install node_modules in your local

2) AWS.config.update({
  accessKeyId: //TODO Insert accessKeyId here,
  secretAccessKey: //TODO Insert secretAccessKey here,
  region: //TODO Insert region here,
});

Replace the TODO's with the actual environment values to which we have to connect

3) To run the application ->node app.js