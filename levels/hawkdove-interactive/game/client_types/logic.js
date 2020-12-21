/**
 * # Logic type implementation of the game stages
 * Copyright(c) 2018 Ewen <wang.yuxu@husky.neu.edu>
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */

"use strict";

const ngc = require('nodegame-client');
const fs = require('fs');
const stepRules = ngc.stepRules;
const constants = ngc.constants;
const J = ngc.JSUS;
const path = require('path');
let counter = 0;

module.exports = function (treatmentName, settings, stager, setup, gameRoom) {

    let node = gameRoom.node;
    let channel = gameRoom.channel;

    // Must implement the stages here.

    // Increment counter.
    counter = counter ? ++counter : settings.SESSION_ID || 1;

    node.game.gameData = {};
    node.game.payoffs = settings.PAYOFFS;

    stager.setOnInit(function () {
        // initialize data container (props) in object for given player
        let initDataContainer = function (pid) {
            if (!node.game.gameData[pid]) {
                node.game.gameData[pid] = {};
                node.game.gameData[pid].visits = [];
                node.game.gameData[pid].orders = [];
                node.game.gameData[pid].totalEarnings = 0;
                node.game.gameData[pid].timeups = 0;
                let plFiltered = node.game.pl.db.filter(function (x) {
                    return x.id === pid;
                });
                if (plFiltered.length === 0) {
                    node.game.gameData[pid].clientType = 'bot'
                }
                else {
                    node.game.gameData[pid].clientType = plFiltered[0].clientType;
                }
            }
        };

        // handle dropouts
        node.on.pdisconnect(function (player) {
            player.allowReconnect = false;
            initDataContainer(player.id);
            node.game.gameData[player.id].visits.push('DROPOUT');
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

        node.on.data('response', function (msg) {
            let visitorClient = channel.registry.getClient(msg.data.visitor);
            let visiteeClient = channel.registry.getClient(msg.data.visitee);
            initDataContainer(msg.data.visitor);
            let visitorEarning = node.game.payoffs[msg.data.visitStrategy + msg.data.responseStrategy]
            let visiteeEarning = node.game.payoffs[msg.data.responseStrategy + msg.data.visitStrategy];
            // penalized players if they ran out of time
            if (msg.data.visitorTimeup) {
                visitorEarning = Math.floor(node.game.gameData[msg.data.visitor].totalEarnings * - settings.PERCENT_PENALTY);
                node.game.gameData[msg.data.visitor].timeups += 1;
            }
            if (msg.data.visiteeTimeup) {
                visiteeEarning = Math.floor(node.game.gameData[msg.data.visitee].totalEarnings * - settings.PERCENT_PENALTY);
                node.game.gameData[msg.data.visitee].timeups += 1;
            }
            node.game.gameData[msg.data.visitor].visits.push({
                visitee: msg.data.visitee,
                visitStrategy: msg.data.visitStrategy,
                responseStrategy: msg.data.responseStrategy,
                visitorEarning: visitorEarning,
                visiteeEarning: visiteeEarning,
                visitTime: msg.data.visitTime,
                respondTime: msg.data.respondTime,
                round: msg.data.round,
                visitorTimeup: msg.data.visitorTimeup,
                visiteeTimeup: msg.data.visiteeTimeup
            });

            // update visitor earnings
            node.game.gameData[msg.data.visitor].totalEarnings += visitorEarning;
            visitorClient.win = visitorClient.win ? visitorClient.win + visitorEarning : visitorEarning;
            // update visitee earnings
            node.game.gameData[msg.data.visitee].totalEarnings += visiteeEarning;
            visiteeClient.win = visiteeClient.win ? visiteeClient.win + visiteeEarning : visiteeEarning;
        });

        node.on.data('order', function (msg) {
            initDataContainer(msg.from);
            node.game.gameData[msg.from].orders.push(msg.data);
        });

        node.on.data('symbolOrders', function (msg) {
            initDataContainer(msg.from);
            node.game.gameData[msg.from].interface = msg.data;
        });
    });

    stager.extendStep('visit', {
        cb: function () {
            if (node.game.getRound() > 1) {
                broadcastPlayerEarnings();
            }
            node.on.data('done', function (msg) {
                let visitor = msg.from;
                let visitee = msg.data.visitee;
                let strategy = msg.data.strategy;
                let visitTime = msg.data.decisionTime;
                let timeup = msg.data.timeup;
                node.say('addVisit', visitee, { visitor: visitor, strategy: strategy, visitTime: visitTime, visitorTimeup: timeup });
            })
        }
    });

    stager.extendStep('respond', {
        cb: function () {
            broadcastPayoffs(node.game.payoffs);
        }
    });

    // stager.setDefaultStepRule(stepRules.WAIT);

    stager.extendStep('endSurvey', {
        cb: function () {
            let surveyPath = path.join(channel.getGameDir(), 'experiments', 'data_' + node.nodename + '.json');
            console.log("Saving game data to " + surveyPath);
            fs.writeFile(surveyPath, JSON.stringify(node.game.gameData, null, 2), function (err) {
                if (err) {
                    console.log(err);
                }
            });
            node.on.data('done', function (msg) {
                if (msg.data.surveyData) {
                    let surveyPath = path.join(channel.getGameDir(), 'experiments', 'survey', msg.from + '.json');
                    console.log("Saving survey data to " + surveyPath);
                    let dataString = JSON.stringify(msg.data.surveyData, null, 2);
                    fs.appendFile(surveyPath, dataString, function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                }
            });
        }
    });

    stager.extendStep('payoffs', {
        cb: function () {
            addBasePay();
            // Send message to each player that will be caught
            // by EndScreen widget, formatted and  displayed.
            gameRoom.computeBonus({
                say: true,
                dump: true,
                print: true
            });

            // Do something with eventual incoming data from EndScreen.
            node.on.data('email', function (msg) {
                // Store msg to file.
            });
            node.on.data('feedback', function (msg) {
                // Store msg to file.
            });
        }
    });

    stager.setOnGameOver(function () {

    });

    // Adds base pay to players who have completed enough rounds
    let addBasePay = function () {
        let data = node.game.gameData;
        for (let pid in data) {
            if (data.hasOwnProperty(pid)) {
                if (data[pid].timeups < settings.REPEAT / 2) {
                    let client = channel.registry.getClient(pid);
                    if (client)
                        client.win += settings.BASEPAY;
                }
            }
        }
    };

    let broadcastPlayerEarnings = function () {
        let data = node.game.gameData;
        for (let player in data) {
            let visits = data[player].visits;
            if (visits[visits.length - 1]) {
                node.say('updateEarnings', player, {
                    lastRound: visits[visits.length - 1].visitorEarning,
                    total: data[player].totalEarnings
                });
            }
        }
    };

    let broadcastPayoffs = function (payoffs) {
        for (let player of node.game.pl.db) {
            node.say('updatePayoffs', player.id, payoffs);
        }
    };

    let broadcastDropOut = function (id) {
        for (let player of node.game.pl.db) {
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
