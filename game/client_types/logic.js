/**
 * # Logic type implementation of the game stages
 * Copyright(c) 2018 Ewen <wang.yuxu@husky.neu.edu>
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */

"use strict";

var ngc = require('nodegame-client');
var fs = require('fs');
var stepRules = ngc.stepRules;
var constants = ngc.constants;
var J = ngc.JSUS;
var counter = 0;

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var node = gameRoom.node;
    var channel =  gameRoom.channel;

    // Must implement the stages here.

    // Increment counter.
    counter = counter ? ++counter : settings.SESSION_ID || 1;

    var survey;
    stager.setOnInit(function() {
        node.on.data('practice-done', function(msg) {

            console.log('Moving player ' + msg.from + ' to waiting room.');
            channel.moveClientToGameLevel(msg.from, 'hawkdove-interactive',
                                              gameRoom.name);	
            if(survey){
                var path = channel.getGameDir() + 'experiments/survey_' + node.nodename + '.json';
                console.log("Saving survey data to " + path);
                fs.writeFile(path, JSON.stringify(survey, null, 2), function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
            }
        });
        
        node.on.data('survey', function(msg){
            if(!survey)
                survey = {};
            survey[msg.from] = msg.data;
        });
    });
    stager.setDefaultStepRule(stepRules.WAIT);
    // Here we group together the definition of the game logic.
    return {
        nodename: 'lgc' + counter,
        // Extracts, and compacts the game plot that we defined above.
        plot: stager.getState(),

    };

};
