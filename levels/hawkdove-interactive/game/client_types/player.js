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

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var game;
    
    stager.setDefaultStepRule(stepRules.SOLO_STEP);
    stager.setOnInit(function() {

        // Initialize the client.

        var frame;

        

        // Bid is valid if it is a number between 0 and 100.
        this.isValidBid = function(n) {
            return node.JSUS.isInt(n, -1, 101);
        };

        this.randomOffer = function(offer, submitOffer) {
            var n;
            n = JSUS.randomInt(-1,100);
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
        this.shuffle = function (a) {
            var j, x, i;
            for (i=0; i<a.length; i++) {
                j = Math.floor(Math.random() * (i + 1));
                x = a[i];
                a[i] = a[j];
                a[j] = x;
            }
            return a;
        };

        this.neighbors = [];

        this.createButton = function(id, div, x, y, symbol) {
            console.log('Creating button ' + symbol);
            if(!this.neighbors[id]){
                this.neighbors[id] = document.createElement('button');
                this.neighbors[id].setAttribute('type', 'button');
                this.neighbors[id].setAttribute('class', 'circle-badge btn');
                this.neighbors[id].innerHTML = symbol;
                this.neighbors[id].style.position = 'absolute';
                this.neighbors[id].style.left = x + 'px';
                this.neighbors[id].style.top = y + 'px';
                this.neighbors[id].setAttribute('data-toggle', 'modal');
                this.neighbors[id].setAttribute('data-target', '#visit');
                div.appendChild(this.neighbors[id]);
            }
        };

        this.symbols = ['3', '4', '1', '2', '6', '5'];
        this.shuffle(this.symbols);
        //this.doneButton = node.widgets.append('DoneButton', this.header);
        //this.doneButton._setText('Done');
        

        // Additional debug information while developing the game.
        // this.debugInfo = node.widgets.append('DebugInfo', header)
    });

    stager.extendStep('game', {
        donebutton: false,
        frame: 'game.htm',
        cb: function(){
            var neighborsDiv = W.gid('players');
            var ybtn = W.gid('ybtn');
            var angle = 180 / (node.game.pl.size()+1);
            var offset = 180;
            for(var i=0; i<node.game.pl.size(); i++){
                var player = node.game.pl.db[i];
                var rads = (offset + angle * (i+1)) * Math.PI / 180;
                var x = Math.cos(rads) * 300 + 500;
                var y = Math.sin(rads) * 300 + 500;
                this.createButton(player.id, neighborsDiv, x, y, this.symbols[i]);
            }
            ybtn.onclick = function(){
                node.done();
            };
        }
    });

    /*stager.extendStep('game', {
        donebutton: false,
        frame: 'game.htm',
        roles: {
            DICTATOR: {
                timer: settings.bidTime,
                cb: function() {
                    var button, offer, div;

                    // Make the dictator display visible.
                    div = W.getElementById('dictator').style.display = '';
                    button = W.getElementById('submitOffer');
                    offer =  W.getElementById('offer');

                    // Listen on click event.
                    button.onclick = function() {
                        var decision;

                        // Validate offer.
                        decision = node.game.isValidBid(offer.value);
                        if ('number' !== typeof decision) {
                            W.writeln('Please enter a number between ' +
                                      '0 and 100.');
                            return;
                        }
                        button.disabled = true;

                        // Mark the end of the round, and
                        // store the decision in the server.
                        node.done({ offer: decision });
                    };
                },
                timeup: function() {
                    node.game.randomOffer(W.getElementById('offer'),
                                          W.getElementById('submitOffer'));
                }
            },
            OBSERVER: {
                cb: function() {
                    var span, div, dotsObj;

                    // Make the observer display visible.
                    div = W.getElementById('observer').style.display = '';
                    span = W.getElementById('dots');
                    dotsObj = W.addLoadingDots(span);

                    node.on.data('decision', function(msg) {
                        dotsObj.stop();
                        W.setInnerHTML('waitingFor', 'Decision arrived: ');
                        W.setInnerHTML('decision',
                                       'The dictator offered: ' +
                                       msg.data + ' ECU.');

                        node.timer.randomDone();
                    });
                }
            }
        }
    });

    stager.extendStep('end', {
        donebutton: false,
        frame: 'end.htm',
        cb: function() {
            node.game.visualTimer.setToZero();
        }
    });
*/
    game = setup;
    game.plot = stager.getState();
    return game;
};
