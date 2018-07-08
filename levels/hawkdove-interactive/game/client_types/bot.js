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
module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var game;

    var channel = gameRoom.channel;
    var logic = gameRoom.node;

    if(settings.BOT_TYPE == 'NAIVE'){
        stager.setOnInit(function() {
            var that, node;
            
            that = this;
            node = this.node;
    
            this.other = null;
        });
        stager.setDefaultCallback(function() {
            this.node.done();  
        });
    
        stager.extendStep('visit', {
           
        });
    
        stager.extendStep('respond', {
          
        });
    } 

    if(settings.BOT_TYPE == 'REINFORCEMENT'){
        var visitWeights = settings.BOT_WEIGHTS.visit;
        var respondWeights = settings.BOT_WEIGHTS.respond;
        stager.setOnInit(function() {
            var that, node;
            
            that = this;
            node = this.node;
    
            this.other = null;
        });
        stager.extendStep('visit', 
        {
            cb: function() {
                // node.done({ visitor: node.player.id, visitee: visitId, strategy: strategy });
            }
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
