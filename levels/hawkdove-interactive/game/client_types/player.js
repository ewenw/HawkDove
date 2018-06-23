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

        this.createButton = function(obj, id, div, x, y, symbol) {
            var btn;
            if(!this.neighbors[id]){
                this.neighbors[id] = document.createElement('button');
                btn = this.neighbors[id];
                btn.setAttribute('type', 'button');
                btn.setAttribute('class', 'circle-badge btn');
                btn.innerHTML = symbol;
                btn.style.position = 'absolute';
                btn.style.left = x + 'px';
                btn.style.top = y + 'px';
                btn.setAttribute('data-toggle', 'modal');
                btn.setAttribute('data-target', '#visit');
                div.appendChild(btn);
                btn.onclick = function(){
                    obj.visitId = id;
                    console.log(obj.visitId);
                };
                div.appendChild(btn);
            
            }
        };

        this.symbols = ['@', '#', '$', '%', '^', '&'];
        this.shuffle(this.symbols);
        //this.doneButton = node.widgets.append('DoneButton', this.header);
        //this.doneButton._setText('Done');
        

        // Additional debug information while developing the game.
        // this.debugInfo = node.widgets.append('DebugInfo', header)
    });

    stager.extendStep('visit', {
        donebutton: false,
        frame: 'visit.htm',
        cb: function(){
            var neighborsDiv = W.gid('players');
            var xbtn = W.gid('xbtn');
            var ybtn = W.gid('ybtn');
            var angle = 180 / (node.game.pl.size()+1);
            var offset = 180;
            var that = this;
            this.visitId = null;
            for(var i=0; i<node.game.pl.size(); i++){
                var player = node.game.pl.db[i];
                var rads = (offset + angle * (i+1)) * Math.PI / 180;
                var x = Math.cos(rads) * 300 + 500;
                var y = Math.sin(rads) * 300 + 500;
                that.createButton(that, player.id, neighborsDiv, x, y, that.symbols[i]);
            }
            xbtn.onclick = function(){
                node.done({visitor: node.player.id, visitee: that.visitId, strategy: 'x'});
            };
            ybtn.onclick = function(){
                node.done({visitor: node.player.id, visitee: that.visitId, strategy: 'y'});
            };
        }
    });
/*
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
