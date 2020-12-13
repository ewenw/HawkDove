/**
 * # Bot type implementation of the game stages
 * Copyright(c) 2018 Ewen <wang.yuxu@husky.neu.edu>
 * MIT Licensed
 *
 * Handles automatic play.
 *
 * http://www.nodegame.org
 */

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    let channel = gameRoom.channel;
    let node = gameRoom.node;
    const ngc =  require('nodegame-client');

    var stager;

    let game = gameRoom.getClientType('player');
    game.env.auto = true;
    game.nodename = 'autoplay';

    stager = ngc.getStager(game.plot);

    stager.extendAllSteps(function(o) {
        var role;
        if (o.roles) {
            o._roles = {};
            for (role in o.roles) {
                if (o.roles.hasOwnProperty(role)) {
                    // Copy only cb property.
                    o._roles[role] = o.roles[role].cb;
                    // Make a new one.
                    o.roles[role].cb = function() {
                        var _cb, stepObj, id;
                        stepObj = this.getCurrentStepObj();
                        id = stepObj.id

                        _cb = stepObj._roles[this.role];
                        _cb.call(this);

                        if ((this.role === 'DICTATOR' && id === 'game')) {
                            node.on('PLAYING', function() {
                                node.timer.randomExec(function() {
                                    node.game.timer.doTimeUp();
                                });
                            });
                        }
                    }
                }
            }
        }
        else {
            o._cb = o.cb;
            o.cb = function() {
                var _cb, stepObj, id;
                stepObj = this.getCurrentStepObj();
                id = stepObj.id

                _cb = stepObj._cb;
                _cb.call(this);

                // TODO: Adapt to specific steps.
                // if (id === XXX) ...

                node.timer.randomDone(2000);
            };
        }
        return o;
    });

    game.plot = stager.getState();

    return game;
};
