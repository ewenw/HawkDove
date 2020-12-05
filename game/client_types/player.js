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

        this.backButton = document.createElement('input');
        this.backButton.setAttribute('type', 'button');
        this.backButton.setAttribute('id', 'backbutton');
        this.backButton.setAttribute('class', 'btn btn-lg btn-secondary');
        this.backButton.setAttribute('value', 'Back');
        this.backButton.onclick = function(){
            var curStage = node.game.getCurrentGameStage();
            var stepId = curStage.step;
            if(stepId > 1){
                curStage.step = curStage.step-1;
                node.game.gotoStep(curStage);
            }

        }
        this.header.appendChild(this.backButton);

        this.doneButton = node.widgets.append('DoneButton', this.header);
        //this.doneButton._setText('Done');


        // Additional debug information while developing the game.
        // this.debugInfo = node.widgets.append('DebugInfo', header)
    });

    stager.extendStep('welcome', {
        frame: 'welcome.htm',
        cb: function(){
           // this.doneButton.button.style.visibility = "hidden";
           // this.nextButton.style.visibility = "visible";
        }
    });

    stager.extendStep('instructions', {
        frame: 'instructions.htm',
        cb: function(){
            //this.doneButton.button.style.visibility = "hidden";
            //this.nextButton.style.visibility = "visible";
        }
    });

    stager.extendStep('survey',
    {
        frame: 'survey.htm',
        cb: function(){
            var root = document.body;
            var widgetsDiv = W.gid('widgets');
            var w = node.widgets;
           // this.nextButton.style.visibility = "hidden";
           // this.doneButton.button.style.visibility = "visible";
            this.survey = node.widgets.append('ChoiceManager', widgetsDiv, {
                id: 'survey',
                title: false,
                forms: [
                    w.get('ChoiceTable', {
                        id: 'age',
                        mainText: 'What is your age group?',
                        choices: [
                            '18-20', '21-30', '31-40', '41-50',
                            '51-60', '61-70', '71+', 'Do not want to say'
                        ],
                        title: false,
                        requiredChoice: true
                    }),
                    w.get('ChoiceTable', {
                        id: 'gender',
                        mainText: 'What is your gender?',
                        choices: [
                            'Male', 'Female', 'Other', 'Do not want to say'
                        ],
                        title: false,
                        requiredChoice: true
                    }),
                    w.get('ChoiceTable', {
                        id: 'education',
                        mainText: 'What is your highest level of education?',
                        choices: [
                            'No high school', 'High school/GED', 'Some college', 'College graduate', 'Higher'
                        ],
                        title: false,
                        requiredChoice: true
                    }),
                    w.get('ChoiceTable', {
                        id: 'location',
                        mainText: 'What is your location?',
                        choices: [
                            'US', 'India', 'Other', 'Do not want to say'
                        ],
                        title: false,
                        requiredChoice: true
                    })
                ]
            });
        },
        done: function() {
            var answers;
            answers = this.survey.getValues({
                markAttempt: true,
                highlight: true
            });
            if (!answers.isCorrect) return false;
            node.say('survey', 'SERVER', answers);
            return answers;
        }
    });

    stager.extendStep('practice', {
        donebutton: false,
        frame: 'practice.htm',
        cb: function(){
            var symbols = ['3', '4', '1', '2', '6', '5'];
            var neighborsDiv = W.gid('players');
            var ybtn = W.gid('ybtn');
            var angle = 180 / (symbols.length + 1);
            var offset = 180;
            this.neighbors = [];
            for(var i=0; i<symbols.length; i++){
                this.neighbors[i] = document.createElement('button');
                this.neighbors[i].setAttribute('type', 'button');
                this.neighbors[i].setAttribute('class', 'circle-badge btn');
                this.neighbors[i].innerHTML = symbols[i];
                this.neighbors[i].style.position = 'relative';
                var rads = (offset + angle * (i+1)) * Math.PI / 180;
                var x = Math.cos(rads) * 18 + 22;
                var y = Math.sin(rads) * -80;
                this.neighbors[i].style.left = x + '%';
                this.neighbors[i].style.top = y + '%';
                neighborsDiv.appendChild(this.neighbors[i]);
            }
            this.neighbors[2].setAttribute('data-toggle', 'modal');
            this.neighbors[2].setAttribute('data-target', '#visit');
            ybtn.onclick = function(){
                node.done();
            };
        }
    });

    stager.extendStep('practice_respond', {
        donebutton: false,
        frame: 'practice_respond.htm',
        cb: function(){
           var zbtn = W.gid('zbtn');
           var container = W.gid('container');
           zbtn.onclick = function(){
               container.innerHTML = '<br/><br/><p>You earned 100 points by responding to a player with action "Z".</p>' +
               '<p class="outline">The points earned from responding to a visit will be shown here.</p>';

               setTimeout(function (){
                    container.innerHTML = '<br/><br/><p>You earned 50 points by visiting player 1 with action "Y".</p>' +
                    '<p class="outline">The points earned from your most recent visit to another player will be shown here.</p>';
                    W.gid('donebutton').disabled = false;
               }, 5000);
           };
        }
    });

    stager.extendStep('practice_end', {
        donebutton: true,
        frame: 'practice_over.htm',
        done: function(){
            node.say('practice-done');
        }
    });

    game = setup;
    game.plot = stager.getState();
    return game;
};
