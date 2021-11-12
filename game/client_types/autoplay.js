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

    let game = gameRoom.getClientType('player');
    game.env.auto = true;
    game.nodename = 'autoplay';

    stager = ngc.getStager(game.plot);

    stager.setOnInit(function() {
        // Call the original init function, if found.
        let origInit = node.game.getProperty('origInit');
        if (origInit) origInit.call(this);

        // TODO: implement it.

        // Auto play, depedending on the step.
        node.on('PLAYING', function() {
            node.timer.setTimeout(function() {
                node.timer.random.timeup();
            }, 2000);
        });

    });

    game.plot = stager.getState();

    return game;
};
