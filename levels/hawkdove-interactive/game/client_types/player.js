/**
 * # Player type implementation of the game stages
 * Copyright(c) 2018 Ewen <wang.yuxu@husky.neu.edu>
 * MIT Licensed
 *
 * Each client type must extend / implement the stages defined in `game.stages`.
 * Upon connection each client is assigned a client type and it is automatically
 * setup with it.
 *
 * http://www.nodegame.org
 * ---
 */

"use strict";

var ngc = require('nodegame-client');
var stepRules = ngc.stepRules;
var constants = ngc.constants;
var publishLevels = constants.publishLevels;

module.exports = function (treatmentName, settings, stager, setup, gameRoom) {

    var game;

    stager.setDefaultStepRule(stepRules.WAIT);
    stager.setOnInit(function () {

        // Initialize the client.

        var frame;

        // A queue of visits to be responded to
        node.game.visitsQueue = [];

        // Payoff table
        node.game.payoffs = {};

        // Player earnings
        node.game.earnings = {};

        // Keep track of original players to distinguish possible bots from players
        node.game.originalIds = node.game.pl.id.getAllKeyElements();

        // Bid is valid if it is a number between 0 and 100.
        this.isValidBid = function (n) {
            return node.JSUS.isInt(n, -1, 101);
        };

        this.randomOffer = function (offer, submitOffer) {
            var n;
            n = JSUS.randomInt(-1, 100);
            offer.value = n;
            submitOffer.click();
        };

        // Setup page: header + frame.
        this.header = W.generateHeader();
        frame = W.generateFrame();


        // Add widgets.
        this.visualRound = node.widgets.append('VisualRound', this.header);
        this.visualTimer = node.widgets.append('VisualTimer', this.header);

        /**
         * Shuffles array in place.
         * @param {Array} a items An array containing the items.
         */
        node.game.shuffle = function (a) {
            var j, x, i;
            for (i = 0; i < a.length; i++) {
                j = Math.floor(Math.random() * (i + 1));
                x = a[i];
                a[i] = a[j];
                a[j] = x;
            }
            return a;
        };

        this.neighbors = [];

        this.createButton = function (obj, id, div, x, y, symbol) {
            var btn;
            this.neighbors[id] = document.createElement('button');
            btn = this.neighbors[id];
            btn.setAttribute('type', 'button');
            btn.setAttribute('class', 'circle-badge btn');
            btn.innerHTML = symbol;
            btn.style.position = 'relative';
            btn.style.left = x + 'px';
            btn.style.top = y + 'px';
            if (node.game.originalIds.hasOwnProperty(id)) {
                btn.setAttribute('data-toggle', 'modal');
                btn.setAttribute('data-target', '#visit');
                btn.onclick = function () {
                    obj.visitId = id;
                    console.log(obj.visitId);
                };
            }
            else {
                btn.disabled = true;
                console.log('Disabling button');
            }
            div.appendChild(btn);
        };

        this.visit = function (strategy, visitId) {
            node.done({ visitee: visitId, strategy: strategy });
        };
        this.respond = function (strategy, timeup) {
            var visit = node.game.visitsQueue.pop();
            var xbtn = W.gid('xbtn');
            var ybtn = W.gid('ybtn');
            var result = W.gid('result');
            var respondDiv = W.gid('respond');
            if(!timeup){
                respondDiv.style.display = 'none';
                result.style.display = 'block';
                result.innerHTML = 'You earned $' + node.game.payoffs[strategy + visit.strategy];
            }
            node.say('response', 'SERVER', {
                visitor: visit.visitor,
                visitee: node.player.id,
                visitStrategy: visit.strategy,
                responseStrategy: strategy,
                round: node.game.getRound()
            });
            setTimeout(function () {
                if (node.game.visitsQueue.length == 0) {
                    node.done();
                    respondDiv.innerHTML = '';
                }
                else {
                respondDiv.style.display = 'block';
                result.style.display = 'none';
                node.game.visualTimer.restart();
                }
            }, 1000);
        };

        this.symbols = ['@', '#', '$', '%', '^', '&', '<', '>', '/', '~'];
        node.game.shuffle(this.symbols);

        node.on.data('addVisit', function (msg) {
            node.game.visitsQueue.push({ visitor: msg.data.visitor, strategy: msg.data.strategy });
        });

        node.on.data('updatePayoffs', function (msg) {
            node.game.payoffs = msg.data;
        });
    });

    stager.extendStep('visit', {
        donebutton: false,
        frame: 'visit.htm',
        timeup: function() {
            var that = this;
            // TODO:
            // penalty and auto decision
            var container = W.gid('container');
            container.innerHTML = '<br/><h2>You ran out of time and have been penalized.</h2>';
            setTimeout(function () {
                var playerList = node.game.pl.db;
                that.visit(Math.random() < 0.5 ? 'H' : 'D', playerList[Math.floor(Math.random()*playerList.length)].id);
            }, 1000);
        },
        cb: function () {
            var that = this;
            var neighborsDiv = W.gid('players');
            var xbtn = W.gid('xbtn');
            var ybtn = W.gid('ybtn');
            var earnings = W.gid('earnings');
            var lastRoundEarnings = W.gid('lastRoundEarnings');
            var totalEarnings = W.gid('totalEarnings');
            var angle = 180 / (node.game.pl.size() + 1);
            var offset = 180;
            this.visitId = null;
            for (var i = 0; i < node.game.pl.size(); i++) {
                var player = node.game.pl.db[i];
                var rads = (offset + angle * (i + 1)) * Math.PI / 180;
                var x = Math.cos(rads) * 300 + 20;
                var y = Math.sin(rads) * 300 + 450;
                that.createButton(that, player.id, neighborsDiv, x, y, that.symbols[i]);
            }

            earnings.style.display = 'none';

            node.on.data('updateEarnings', function (msg) {
                console.log('Earnings updated');
                node.game.earnings = msg.data;
                earnings.style.display = 'block';
                lastRoundEarnings.innerHTML = node.game.earnings.lastRound;
                totalEarnings.innerHTML = node.game.earnings.total;

            });

            xbtn.onclick = function () {
                that.visit('H', that.visitId);
            };

            ybtn.onclick = function () {
                that.visit('D', that.visitId);
            };
        }
    });

    stager.extendStep('respond', {
        donebutton: false,
        frame: 'respond.htm',
        timeup: function () {
            var that = this;
            var respondDiv = W.gid('respond');
            respondDiv.innerHTML = '<br/><br/><h2>You ran out of time and have been penalized.</h2>';
            setTimeout(function () {
                that.respond(Math.random() < 0.5 ? 'H' : 'D', true);
            }, 1000);
        },
        cb: function () {
            var that = this;
            var xbtn = W.gid('xbtn');
            var ybtn = W.gid('ybtn');
            var result = W.gid('result');
            var respondDiv = W.gid('respond');
            var order = [];
            result.style.display = 'none';

            // shuffle visits
            node.game.shuffle(node.game.visitsQueue);

            for (var visit of node.game.visitsQueue) {
                order.push(visit.visitor);
            }

            // send order of responses to server
            node.say('order', 'SERVER', order);

            if (node.game.visitsQueue.length == 0) {
                respondDiv.innerHTML = '<br/><br/><h3>No visitors this round.</h3>';
                console.log('NO VISITORS ----------');
                node.done();
            }
            console.log('HAS VISITORS ' + node.game.visitsQueue.length);

            xbtn.onclick = function () { that.respond('H', false); };
            ybtn.onclick = function () { that.respond('D', false); };
        }
    });
    stager.extendStep('end', {
        donebutton: false,
        frame: 'postgame.htm',
        cb: function () {
            node.game.visualTimer.setToZero();

        }
    });

    game = setup;
    game.plot = stager.getState();
    return game;
};
