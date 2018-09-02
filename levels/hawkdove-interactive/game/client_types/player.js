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
        node.game.earnings = {
            total: 0
        };

        // Keep track of original players to distinguish possible bots from players
        node.game.originalIds = node.game.pl.id.getAllKeyElements();

        // Keep track of penalties
        //node.game.penalties = 0;

        // last round response earnings
        node.game.lastResponseEarnings = 0;

        // previous visit information
        node.game.lastVisit = {};

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
        this.visualRounds = node.widgets.append('VisualRound', this.header);
        this.visualTimer = node.widgets.append('VisualTimer', this.header);
        this.visualRounds.setDisplayMode(['COUNT_UP_ROUNDS_TO_TOTAL']);

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
            btn.innerHTML = '<h2>' + symbol + '</h2>';
            btn.style.position = 'relative';
            btn.style.left = x + '%';
            btn.style.top = y + '%';
            if (node.game.originalIds.hasOwnProperty(id)) {
                btn.setAttribute('data-toggle', 'modal');
                btn.setAttribute('data-target', '#visit');
                btn.onclick = function () {
                    obj.visitId = id;
                    obj.symbol = symbol;
                    console.log(obj.visitId);
                };
            }
            else {
                btn.disabled = true;
                console.log('Disabling button');
            }
            div.appendChild(btn);
        };

        this.visit = function (strategy, visitId, symbol, timeup) {
            node.game.lastVisit = { strategy: strategy, symbol: symbol };
            node.done({ visitee: visitId, strategy: strategy, decisionTime: node.game.visualTimer.gameTimer.timePassed, timeup: timeup });
        };

        this.respond = function (strategy, timeup) {
            var visit = node.game.visitsQueue.pop();
            var xbtn = W.gid('xbtn');
            var ybtn = W.gid('ybtn');
            var result = W.gid('result');
            var respondDiv = W.gid('respond');
            node.game.timer.restart();
            if (!timeup) {
                respondDiv.style.display = 'none';
                result.style.display = 'block';
                var strat = this.choices[this.strategies.indexOf(strategy)];
                result.innerHTML = '<br/><br/><center>You earned <u>' + node.game.payoffs[strategy + visit.strategy] +
                    '</u> points by responding with action <button class="btn btn-secondary btn-s"><b>' + strat + '</b></button>.</center>';
                node.game.lastResponseEarnings += node.game.payoffs[strategy + visit.strategy];
            }
            else
                node.game.lastResponseEarnings += node.game.earnings.total * -node.game.settings.PERCENT_PENALTY;
            node.say('response', 'SERVER', {
                visitor: visit.visitor,
                visitee: node.player.id,
                visitStrategy: visit.strategy,
                responseStrategy: strategy,
                visitTime: visit.visitTime,
                respondTime: node.game.visualTimer.gameTimer.timePassed,
                round: node.game.getRound(),
                visitorTimeup: visit.visitorTimeup,
                visiteeTimeup: timeup
            });
            setTimeout(function () {
                if (node.game.visitsQueue.length == 0) {
                    node.done();
                    respondDiv.innerHTML = '';
                }
                else {
                    respondDiv.style.display = 'block';
                    result.style.display = 'none';
                    node.game.timer.restart();
                    node.game.visualTimer.restart();
                }
            }, 2000);
        };

        this.submitEndSurvey = function () {
            var textField1 = W.gid('textField1');
            node.done({
                surveyData:
                    {
                        field1: textField1.value
                    }
            });
        };

        this.clearInterstageText = function () {
            var waitScreenDiv = W.gid('ng_waitScreen');
            waitScreenDiv.style.background = 'white';
            waitScreenDiv.style.color = 'black';
            waitScreenDiv.style.opacity = 1;
        }

        this.symbols = ['(', ')', '|', '%', '^', '&', '<', '>', '-', '~'];
        this.choices = ['@', '#'];
        this.strategies = ['H', 'D'];
        node.game.shuffle(this.symbols);
        node.game.shuffle(this.choices);
        node.game.shuffle(this.strategies);
        node.say('symbolOrders', 'SERVER', {
            symbols: this.symbols,
            buttonOrder: this.choices,
            strategyOrder: this.strategies
        });

        node.on.data('addVisit', function (msg) {
            node.game.visitsQueue.push({ visitor: msg.data.visitor, strategy: msg.data.strategy, visitTime: msg.data.visitTime, visitorTimeup: msg.data.visitorTimeup });
        });

        node.on.data('updatePayoffs', function (msg) {
            node.game.payoffs = msg.data;
        });

        
        // Enable scroll bar at all times
        var scrollStyle = document.createElement('style');
        scrollStyle.innerHTML = "body {overflow-y: scroll;}";
        document.head.appendChild(scrollStyle);
        
    });

    stager.extendStep('precache', {        
        //////////////////////////////////////////////
        // nodeGame hint:
        //
        // Pages can be preloaded with this method: W.preCache()
        //
        // The content of a URI is cached in an array, and
        // loaded again from there when needed.
        // Pages that embed JS code should be cached with caution.
        /////////////////////////////////////////////
        cb: function() {
            W.lockScreen('Loading...');
            console.log('pre-caching...');
            W.preCache([
                // Precache some pages for demonstration.
                'visit.htm',
                'respond.htm'
            ], function() {
                console.log('Precache done.');
                // Pre-Caching done; proceed to the next stage.
                node.done();
            });
        }
    });

    stager.extendStep('visit', {
        donebutton: false,
        frame: 'visit.htm',
        timeup: function () {
            var that = this;
            var container = W.gid('container');
            container.innerHTML = '<br/><center><h2><b>You ran out of time and have been penalized.</b></h2></center>';
            //node.game.penalties++;
            setTimeout(function () {
                var playerList = node.game.pl.db;
                var index = Math.floor(Math.random() * playerList.length);
                that.visit(Math.random() < 0.5 ? 'H' : 'D', playerList[index].id, that.symbols[index], true);
            }, 1000);
        },
        cb: function () {
            var that = this;
            var neighborsDiv = W.gid('players');
            var xbtn = W.gid('xbtn');
            var ybtn = W.gid('ybtn');
            var earnings = W.gid('earnings');
            var lastRoundEarnings = W.gid('lastRoundEarnings');
            var responseEarnings = W.gid('responseEarnings');
            var totalEarnings = W.gid('totalEarnings');
            var visitEarnings = W.gid('visitEarnings');
            var container = W.gid('container');
            var angle = 180 / (node.game.pl.size() + 1);
            var offset = 180;
            this.visitId = null;
            xbtn.innerHTML = this.choices[0];
            ybtn.innerHTML = this.choices[1];
            that.clearInterstageText();
            if (node.game.getRound() == 1)
                container.style.display = 'block';
            if (node.game.pl.size() == 1)
                that.createButton(that, node.game.pl.db[0].id, neighborsDiv, 105, 450, that.symbols[0]);
            else {
                for (var i = 0; i < node.game.pl.size(); i++) {
                    var player = node.game.pl.db[i];
                    var rads = (offset + angle * (i + 1)) * Math.PI / 180;
                    var x = Math.cos(rads) * 18 + 25;
                    // var y = Math.sin(rads) * 80 + 100;
                    var y = -Math.sin(rads) * 80 - 35;
                    that.createButton(that, player.id, neighborsDiv, x, y, that.symbols[i]);
                }
            }
            earnings.style.display = 'none';

            node.on.data('updateEarnings', function (msg) {
                console.log('Earnings updated');
                var symbol = node.game.lastVisit.symbol;
                var strat = that.choices[that.strategies.indexOf(node.game.lastVisit.strategy)];
                visitEarnings.innerHTML = 'Your visit to  <button class="circle-badge-icon btn"><b>' + symbol +
                    '</b></button> with action <button class="btn btn-secondary btn-s"><b>' + strat + '</b></button> earned <u>' + msg.data.lastRound + '</u> points.';
                setTimeout(function () {
                    node.game.earnings = msg.data;
                    earnings.style.display = 'block';
                    lastRoundEarnings.innerHTML = node.game.earnings.lastRound;
                    responseEarnings.innerHTML = node.game.lastResponseEarnings;
                    totalEarnings.innerHTML = node.game.earnings.total;
                    container.style.display = 'block';
                    visitEarnings.innerHTML = '';
                }, 2800);

            });

            xbtn.onclick = function () {
                that.visit(that.strategies[0], that.visitId, that.symbol, false);
            };

            ybtn.onclick = function () {
                that.visit(that.strategies[1], that.visitId, that.symbol, false);
            };
        }
    });

    stager.extendStep('respond', {
        donebutton: false,
        frame: 'respond.htm',
        timeup: function () {
            var that = this;
            var resultDiv = W.gid('result');
            var respondDiv = W.gid('respond');
            respondDiv.style.display = 'none';
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = '<br/><br/><center><h2><b>You ran out of time and have been penalized.</b></h2></center>';
            //node.game.penalties++;
            setTimeout(function () {
                that.respond(Math.random() < 0.5 ? 'H' : 'D', true);
            }, 1300);
        },
        cb: function () {
            var that = this;
            var xbtn = W.gid('xbtn');
            var ybtn = W.gid('ybtn');
            var result = W.gid('result');
            var respondDiv = W.gid('respond');
            var order = [];
            that.clearInterstageText();
            node.game.lastResponseEarnings = 0;
            result.style.display = 'none';
            respondDiv.style.display = 'none';
            xbtn.innerHTML = this.choices[0];
            ybtn.innerHTML = this.choices[1];
            // shuffle visits
            node.game.shuffle(node.game.visitsQueue);

            for (var visit of node.game.visitsQueue) {
                order.push(visit.visitor);
            }

            // send order of responses to server
            node.say('order', 'SERVER', order);

            respondDiv.style.display = 'block';
            if (node.game.visitsQueue.length == 0) {
                var waitScreenDiv = W.gid('ng_waitScreen');
                waitScreenDiv.style.opacity = 0;
                respondDiv.innerHTML = '<br/><br/><h2><center>No visitors this round.</center></h2>';
                setTimeout(function () {
                    node.done();
                }, 1000);
            }
            xbtn.onclick = function () { that.respond(that.strategies[0], false); };
            ybtn.onclick = function () { that.respond(that.strategies[1], false); };
        }
    });
    stager.extendStep('endSurvey', {
        donebutton: false,
        frame: 'postgame.htm',
        cb: function () {
            var that = this;
            node.game.visualTimer.setToZero();
            var submit = W.gid('submit');
            submit.onclick = function () {
                that.submitEndSurvey();
            };
        },
        timeup: function () {
            this.submitEndSurvey();
        }
    });
    stager.extendStep('payoffs', {
        donebutton: false,
        frame: 'end.htm',
        widget: {
            name: 'EndScreen',
            root: "body",
            options: {
                title: false, // Disable title for seamless Widget Step.
                panel: true, // No border around.
                showEmailForm: false,
                showFeedbackForm: false
            }
        }
    });
    game = setup;
    game.plot = stager.getState();
    return game;
};
