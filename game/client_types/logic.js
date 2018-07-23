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

    node.game.survey;
    stager.setOnInit(function() {
        node.on.data('practice-done', function(msg) {
            if(node.game.survey){
                var path = channel.getGameDir() + 'experiments/survey/' + msg.from + '.json';
                console.log("Saving survey data to " + path);
                var dataString = JSON.stringify(node.game.survey, null, 2) + ',';
                fs.appendFile(path, dataString, function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
                // node.game.memory.save('memory_all.json');
            }
            console.log('Moving player ' + msg.from + ' to waiting room.');
            channel.moveClientToGameLevel(msg.from, 'hawkdove-interactive',
                                              gameRoom.name);	
        });
        
        node.on.data('survey', function(msg){
            if(!node.game.survey)
            node.game.survey = {};
            node.game.survey[msg.from] = msg.data;
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
