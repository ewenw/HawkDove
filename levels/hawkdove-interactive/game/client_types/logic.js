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
    node.game.payoffs = settings.PAYOFFS;

    stager.setOnInit(function () {
        // initialize data container (props) in object for given player
        var initDataContainer = function (pid) {
            if (!node.game.visitsQueue[pid]) {
                node.game.visitsQueue[pid] = {};
                node.game.visitsQueue[pid].visits = [];
                node.game.visitsQueue[pid].orders = [];
                node.game.visitsQueue[pid].totalEarnings = 0;
            }
            
        };

        node.on.pdisconnect(function(player) {
            player.allowReconnect = false;
            initDataContainer(player.id);
            node.game.visitsQueue[player.id].visits.push('DROPOUT');
            channel.connectBot({
                room: gameRoom,
                clientType: 'bot',
                setup: {
                    settings: {
                        BOT_STRATEGY: "NAIVE"
                    }
                },
                replaceId: player.id,
                gotoStep: node.player.stage
            });
        });
        node.on.data('done', function (msg) {
            var visitor = msg.from;
            var visitee = msg.data.visitee;
            var strategy = msg.data.strategy;
            console.log('Visit from/to ' + visitor + ' visiting ' + visitee + ' strat' + strategy);
            console.log('FULL DATA -------------- ' + JSON.stringify(msg.data));
            node.say('addVisit', visitee, { visitor: visitor, strategy: strategy });
        })
        node.on.data('response', function (msg) {
            initDataContainer(msg.data.visitor);
            var visitorEarning = node.game.payoffs[msg.data.visitStrategy + msg.data.responseStrategy]
            var visiteeEarning = node.game.payoffs[msg.data.responseStrategy + msg.data.visitStrategy];
            node.game.visitsQueue[msg.data.visitor].visits.push({
                visitee: msg.data.visitee,
                visitStrategy: msg.data.visitStrategy,
                responseStrategy: msg.data.responseStrategy,
                round: msg.data.round,
                visitorEarning: visitorEarning,
                visiteeEarning: visiteeEarning
            });

            // update visitor earnings
            node.game.visitsQueue[msg.data.visitor].totalEarnings = node.game.visitsQueue[msg.data.visitor].totalEarnings + visitorEarning;
            // update visitee earnings
            node.game.visitsQueue[msg.data.visitee].totalEarnings = node.game.visitsQueue[msg.data.visitee].totalEarnings + visiteeEarning;
        });
        node.on.data('order', function (msg) {
            initDataContainer(msg.from);
            node.game.visitsQueue[msg.from].orders.push(msg.data);
        });
    });

    stager.extendStep('visit', {
        cb: function () {
            if (node.game.getRound() > 1) {
                broadcastPlayerEarnings();
            }
            
        }
    });

    stager.extendStep('respond', {
        cb: function () {
            broadcastPayoffs(node.game.payoffs);
        }
    });

    // stager.setDefaultStepRule(stepRules.WAIT);

    stager.extendStep('end', {
        cb: function () {
            var path = channel.getGameDir() + 'data/data_' + node.nodename + '.json';
            console.log("Saving game data to " + path);
            fs.writeFile(path, JSON.stringify(node.game.visitsQueue, null, 2), function (err) {
                if (err) {
                    console.log(err);
                }
            });
        }
    });

    stager.setOnGameOver(function () {

        console.log("Moving player to waiting room");

    });

    var broadcastPlayerEarnings = function () {
        var data = node.game.visitsQueue;
        for (var player in data) {
            var visits = data[player].visits;
            if(visits[visits.length - 1]){
                node.say('updateEarnings', player, {
                    lastRound: visits[visits.length - 1].visitorEarning,
                    total: data[player].totalEarnings
                });
            }
        }
    };

    var broadcastPayoffs = function (payoffs) {
        for (var player of node.game.pl.db) {
            node.say('updatePayoffs', player.id, payoffs);
        }
    };

    var broadcastDropOut = function (id) {
        for (var player of node.game.pl.db) {
            node.say('dropOut', player.id, id);
        }
    };

    // Here we group together the definition of the game logic.
    return {
        nodename: 'lgc' + counter,
        // Extracts, and compacts the game plot that we defined above.
        plot: stager.getState(),

    };

};
