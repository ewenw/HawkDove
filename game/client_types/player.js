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
        this.doneButton = node.widgets.append('DoneButton', this.header);
        this.doneButton._setText('Next');
        this.backButton = document.createElement('input');
        this.backButton.setAttribute('type', 'button');
        this.backButton.setAttribute('id', 'backbutton');
        this.backButton.setAttribute('class', 'btn btn-lg btn-secondary');
        this.backButton.setAttribute('value', 'Back');
        this.backButton.onclick = function(){
            var curStage = node.game.getCurrentGameStage();
            var stepId = curStage.step;
            if(stepId > 0){
                curStage.step = curStage.step-1;
                node.game.gotoStep(curStage);
            }
            
        }
        this.header.appendChild(this.backButton);

        // Additional debug information while developing the game.
        // this.debugInfo = node.widgets.append('DebugInfo', header)
    });

    stager.extendStep('welcome', {
        frame: 'welcome.htm'
    });

    stager.extendStep('instructions', {
        frame: 'instructions.htm'
    });

    stager.extendStep('survey', 
    {
        frame: 'survey.htm',
        cb: function(){
            var root = document.body;
            var widgetsDiv = W.gid('widgets');
            var w = node.widgets;
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
            return answers;
        }
    });

    stager.extendStep('practice', {
        donebutton: false,
        frame: 'practice.htm',
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
