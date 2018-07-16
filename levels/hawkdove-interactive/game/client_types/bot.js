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

    var visitWeights, respondWeights;

    var node;

    stager.setDefaultStepRule(stepRules.WAIT);
   
    /**
     * Shuffles array in place.
     * @param {Array} a items An array containing the items.
    */
    var shuffle = function (a) {
        var j, x, i;
        for (i = 0; i < a.length; i++) {
            j = Math.floor(Math.random() * (i + 1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
        return a;
    };

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
    
    if (settings.BOT_STRATEGY === 'NAIVE') {
        stager.setDefaultStepRule(stepRules.WAIT);
        stager.setDefaultCallback(function () {
            node.done();
        });

        stager.extendStep('visit', {

        });

        stager.extendStep('respond', {

        });
    }
    else if (settings.BOT_STRATEGY === 'REINFORCEMENT') {
        stager.setOnInit(function () {
            var lastStrategy;
            node = this.node;
            visitWeights = settings.BOT_WEIGHTS.visit;
            respondWeights = settings.BOT_WEIGHTS.respond;
            // A queue of visits to be responded to
            node.game.visitsQueue = [];

            // Payoff table
            node.game.payoffs = {};

            // Determines likelihood of visiting each host
            node.game.hostWeights = {};
            node.on.data('addVisit', function (msg) {
                node.game.visitsQueue.push({ visitor: msg.data.visitor, strategy: msg.data.strategy, visitTime: msg.data.visitTime });
            });

            node.on.data('updatePayoffs', function (msg) {
                node.game.payoffs = msg.data;
            });

            node.on.data('updateEarnings', function (msg) {
                console.log('Earnings updated');
                node.game.earnings = msg.data;
                visitWeights[lastStrategy] += node.game.earnings.lastRound;
                // node.game.earnings.total;
            });

            this.visit = function (strategy, visitId) {
                lastStrategy = strategy;
                node.done({ visitee: visitId, strategy: strategy, decisionTime: 0});
            };
        });
        stager.extendStep('visit',
            {
                cb: function () {
                    var that = this;
                    var weights = [];
                    var hostWeights = node.game.hostWeights;
                    node.game.pl.db.forEach(function (host) {
                        if (!hostWeights[host.id]) {
                            hostWeights[host.id] = settings.BOT_WEIGHTS.hostWeight;
                        }
                        weights.push(hostWeights[host.id]);
                    });
                    that.visit(pickWeightedIndex([visitWeights.H, visitWeights.D]) == 0 ? 'H' : 'D', node.game.pl.db[pickWeightedIndex(weights)].id);
                }
            });

        stager.extendStep('respond', {
            cb: function () {
                var that = this;
                var order = [];
                // shuffle visits
                shuffle(node.game.visitsQueue);

                for (var visit of node.game.visitsQueue) {
                    order.push(visit.visitor);
                }

                // send order of responses to server
                node.say('order', 'SERVER', order);

                if (node.game.visitsQueue.length == 0) {
                    node.done();
                }
                else {
                    node.game.visitsQueue.forEach(function (visit) {
                        var strategy = pickWeightedIndex([respondWeights.H, respondWeights.D]) == 0 ? 'H' : 'D';
                        node.say('response', 'SERVER', {
                            visitor: visit.visitor,
                            visitee: node.player.id,
                            visitStrategy: visit.strategy,
                            responseStrategy: strategy,
                            visitTime: visit.visitTime,
                            respondTime: 0,
                            round: node.game.getRound()
                        });
                        respondWeights[strategy] += node.game.payoffs[strategy + visit.strategy];
                    });
                    node.game.visitsQueue = [];
                    node.done();
                }
            }
        });
    }





    // Prepare the game object to return.
    /////////////////////////////////////

    game = {};

    // We serialize the game sequence before sending it.
    game.plot = stager.getState();

    game.nodename = 'bot';

    return game;
};
