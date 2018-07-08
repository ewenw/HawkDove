/**
 * # Bot type implementation of the game stages
 * Copyright(c) 2018 Ewen <wang.yuxu@husky.neu.edu>
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */

var ngc = require('nodegame-client');
var Stager = ngc.Stager;
var stepRules = ngc.stepRules;
var constants = ngc.constants;

// Export the game-creating function.
module.exports = function (treatmentName, settings, stager, setup, gameRoom) {

    var game;

    var channel = gameRoom.channel;
    var logic = gameRoom.node;

    // A queue of visits to be responded to
    var visitsQueue = [];

    // Payoff table
    var payoffs = {};

    // Determines likelihood of visiting each host
    var hostWeights = {};

    if (settings.BOT_TYPE == 'REINFORCEMENT') {
        var visitWeights = settings.BOT_WEIGHTS.visit;
        var respondWeights = settings.BOT_WEIGHTS.respond;
        stager.setOnInit(function () {
            var that, node;

            that = this;
            node = this.node;

            this.other = null;

            node.on.data('addVisit', function (msg) {
                node.game.visitsQueue.push({ visitor: msg.data.visitor, strategy: msg.data.strategy });
            });

            node.on.data('updatePayoffs', function (msg) {
                node.game.payoffs = msg.data;
            });

            node.on.data('updateEarnings', function (msg) {
                console.log('Earnings updated');
                node.game.earnings = msg.data;
                lastRoundEarnings.innerHTML = node.game.earnings.lastRound;
                totalEarnings.innerHTML = node.game.earnings.total;
            });
        });
        stager.extendStep('visit',
            {
                cb: function () {
                    var weights = [];
                    node.game.pl.db.foreach(function (host) {
                        if(!hostWeights[host.id]){
                            hostWeights[host.id] = settings.BOT_WEIGHTS.hostWeight;
                        }
                        weights.push(hostWeights[host.id]);
                    });
                    var hostToVisit = node.game.pl.db[pickWeightedIndex(weights)].id;
                    var strategy = pickWeightedIndex([visitWeights.H, visitWeights.D]) == 0 ? 'H' : 'D';
                    // node.done({ visitor: node.player.id, visitee: visitId, strategy: strategy 
                }
            });

        stager.extendStep('respond', {

        });
    }

    // Picks an index out of array by corresponding weights
    var pickWeightedIndex = function (weights) {
        for (var i = 1; i < weights.length; i++) {
            weights[i] += weights[i - 1];
        }
        var rand = Math.random() * weights[weights.length - 1];
        for (var i = 0; i < weights.length; i++) {
            if (rand > weights[i])
                continue;
            else return i;
        }
    };

    if (settings.BOT_TYPE == 'NAIVE') {
        stager.setOnInit(function () {
            var that, node;

            that = this;
            node = this.node;

            this.other = null;
        });
        stager.setDefaultCallback(function () {
            this.node.done();
        });

        stager.extendStep('visit', {

        });

        stager.extendStep('respond', {

        });
    }

    // Set the default step rule for all the stages.
    stager.setDefaultStepRule(stepRules.WAIT);



    // Prepare the game object to return.
    /////////////////////////////////////

    game = {};

    // We serialize the game sequence before sending it.
    game.plot = stager.getState();
    game.nodename = 'bot';

    return game;
};
