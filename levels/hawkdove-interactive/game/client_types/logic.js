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
var stepRules = ngc.stepRules;
var constants = ngc.constants;
var J = ngc.JSUS;
var counter = 0;

module.exports = function (treatmentName, settings, stager, setup, gameRoom) {

    var node = gameRoom.node;
    var channel = gameRoom.channel;

    // Must implement the stages here.

    // Increment counter.
    counter = counter ? ++counter : settings.SESSION_ID || 1;
    
    /* Data format:
        "12345": {
            visits: [
                {
                    visitee: "2",
                    visitStrategy: "x",
                    responseStrategy: "y",
                    round: "1"
                }, 
                {}, ...
            ],
            orders: [
                [2, 3, 4],
                [5, 1, 2],
                []
            ],
        }
    */
    node.game.visitsQueue = {};

    stager.setOnInit(function () {
        // initialize data container (props) in object for given player
        var initDataContainer = function(pid) {
            if(!node.game.visitsQueue[pid]){
                node.game.visitsQueue[pid] = {};
                node.game.visitsQueue[pid].visits = [];
                node.game.visitsQueue[pid].orders = [];
            }
        };

        node.on.data('response', function (msg) {
            initDataContainer(msg.data.visitor);
            console.log(msg.data);
            node.game.visitsQueue[msg.data.visitor].visits.push({ 
                visitee: msg.data.visitee, 
                visitStrategy: msg.data.visitStrategy, 
                responseStrategy: msg.data.responseStrategy,
                round: msg.data.round});
        });
        node.on.data('order', function (msg) {
            initDataContainer(msg.from);
            console.log(msg.data);
            node.game.visitsQueue[msg.from].orders.push(msg.data);
        });
    });
    stager.extendStep('visit', {
        cb: function () {
            node.on.data('done', function (msg) {
                var visitor = msg.from;
                var visitee = msg.data.visitee;
                var strategy = msg.data.strategy;
                node.say('addVisit', visitee, { visitor: visitor, strategy: strategy });
            })
        }
    });

    stager.extendStep('respond', {
        cb: function () {
           /* console.log('SIZE OF DB IS ' + node.game.memory.size());
            console.log('the visit queue has ' + node.game.visitsQueue);
            for (var player in node.game.visitsQueue) {
                console.log(player);
            }*/
        }
    });

    // stager.setDefaultStepRule(stepRules.WAIT);



    stager.extendStep('end', {
        cb: function () {
            console.log(node.game.visitsQueue);
            node.game.memory.save(channel.getGameDir() + 'data/data_' +
                node.nodename + '.json');
        }
    });

    stager.setOnGameOver(function () {

        console.log("Moving player to waiting room");

    });

    // Here we group together the definition of the game logic.
    return {
        nodename: 'lgc' + counter,
        // Extracts, and compacts the game plot that we defined above.
        plot: stager.getState(),

    };

};
