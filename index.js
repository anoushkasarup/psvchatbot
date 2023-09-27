// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const axios = require('axios');
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }
 
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }
  
  function find(agent) {
    const item = agent.parameters.item;
    const location = agent.parameters.location;
    return new Promise((resolve, reject) => { //censoring identification of sheet for privacy
      axios.get(`https://sheetdb.io/api/v1/*************/search?item=*${item}*&sheet=${location}`).then(function(res) {
      	const where = res.data[0];
      	if (where) {
        	agent.add(`Location: ${where.location}`);
      	} else {
        	agent.add('Not found');
      	}
        resolve();
    	})
    	.catch(function (error) {
      		console.error('Error fetching data from SheetDB:', error);
      		agent.add('Sorry, there was an error while processing your request.');
      });
    });
  }
  
  function instruct(agent) { //still in testing
    console.log(agent.context.get('FindIntent-followup').parameters.item);
    console.log(agent.context.get('FindIntent-followup').parameters.location);
  }
  
  function locate(agent) {
    const area = agent.parameters.area;
    const location = agent.parameters.location;
    
    return new Promise((resolve, reject) => { //censoring identification of sheet for privacy
      axios.get(`https://sheetdb.io/api/v1/*************/search?location=*${area}*&sheet=${location}`).then(function(res) {
        console.log('SheetDB Response:', res.data);
      	const things = res.data;
      	if (things.length > 0) {
        	let response = 'Items found: \n';
        	things.forEach((thing) => {
          		response += `\n- ${thing.item}`;
        	});
        	agent.add(response);
      	} 
        else {
        	agent.add('Not found');
      	}
        resolve();
    	})
    	.catch(function (error) {
      		console.error('Error fetching data from SheetDB:', error);
      		agent.add('Sorry, there was an error while processing your request.');
      });
    });
  }

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('FindIntent', find);
  intentMap.set('LocateIntent', locate);
  intentMap.set('InstructIntent', instruct); 
  agent.handleRequest(intentMap);
});
